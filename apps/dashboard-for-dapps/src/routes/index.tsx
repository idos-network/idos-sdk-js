import {
  Button,
  DataListItem,
  DataListRoot,
  DialogActionTrigger,
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTitle,
  DrawerActionTrigger,
  DrawerBackdrop,
  DrawerCloseTrigger,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerRoot,
  EmptyState,
  Field,
  PasswordInput,
  RefreshButton,
  SearchField,
} from "@/components/ui";
import {
  Center,
  Container,
  DrawerBody,
  DrawerTitle,
  HStack,
  Image,
  List,
  Spinner,
  Stack,
  Text,
} from "@chakra-ui/react";
import { DEFAULT_RECORDS_PER_PAGE, type idOS, type idOSCredential } from "@idos-network/idos-sdk";
import * as Base64Codec from "@stablelib/base64";
import * as Utf8Codec from "@stablelib/utf8";
import { skipToken, useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useDebounce, useLocalStorage, useToggle } from "@uidotdev/usehooks";
import ascii85 from "ascii85";
import { matchSorter } from "match-sorter";
import { useContext, useMemo, useRef, useState } from "react";
import nacl from "tweetnacl";

import { Pagination } from "@/components/pagination";
import { idOSContext, useIdOS } from "@/idOS.provider";

export const Route = createFileRoute("/")({
  component: Index,
  validateSearch: (search): { filter?: string } => {
    return {
      filter: (search.filter as string) ?? undefined,
    };
  },
});

function transformBase85Image(src: string) {
  const prefix = "data:image/jpeg;base85,";

  return `data:image/png;base64,${Base64Codec.encode(
    ascii85.decode(src.substring(prefix.length)),
  )}`;
}

const useFetchGrants = (page: number, idos: idOS) => {
  return useQuery({
    queryKey: ["grants", { page }],
    queryFn: () => idos.listGrantedGrants(page, DEFAULT_RECORDS_PER_PAGE),
    select: (data) => {
      return {
        records: data.grants.map((grant) => ({
          ...grant,
          lockedUntil:
            grant.lockedUntil === 0
              ? "Unlocked"
              : Intl.DateTimeFormat("en-US", {
                  dateStyle: "full",
                  timeStyle: "short",
                }).format(grant.lockedUntil * 1000),
        })),
        totalCount: data.totalCount,
      };
    },
  });
};
type GrantsWithFormattedLockedUntil = NonNullable<ReturnType<typeof useFetchGrants>["data"]>;

const useFetchCredential = (id: string) => {
  const idOS = useIdOS();
  return useQuery({
    queryKey: ["credential-details", id],
    queryFn: id ? () => idOS.data.getShared<idOSCredential>("credentials", id, false) : skipToken,
  });
};

function decrypt(b64FullMessage: string, b64SenderPublicKey: string, secretKey: string) {
  const fullMessage = Base64Codec.decode(b64FullMessage);
  const senderPublicKey = Base64Codec.decode(b64SenderPublicKey);

  const nonce = fullMessage.slice(0, nacl.box.nonceLength);
  const message = fullMessage.slice(nacl.box.nonceLength, fullMessage.length);

  const decrypted = nacl.box.open(message, nonce, senderPublicKey, Base64Codec.decode(secretKey));

  if (decrypted == null) {
    return "";
  }

  return Utf8Codec.decode(decrypted);
}

function SecretKeyPrompt({
  open,
  toggle,
  onSubmit,
}: {
  open: boolean;
  toggle: (value?: boolean) => void;
  onSubmit: (key: string) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [key, setKey] = useState("");

  const handleSave = () => {
    onSubmit(key);
    toggle(false);
  };

  return (
    <DialogRoot
      open={open}
      placement="center"
      onOpenChange={() => {
        toggle(false);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enter your secret key</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <Stack gap="4">
            <Field label="Secret key:">
              <PasswordInput ref={ref} onChange={(e) => setKey(e.target.value)} />
            </Field>
          </Stack>
        </DialogBody>
        <DialogFooter>
          <DialogActionTrigger asChild>
            <Button variant="outline">Cancel</Button>
          </DialogActionTrigger>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
        <DialogCloseTrigger />
      </DialogContent>
    </DialogRoot>
  );
}

function openImageInNewTab(base64Image: string) {
  const newWindow = window.open();

  if (newWindow) {
    newWindow.document.write(`
      <html>
        <head>
          <title>Document Image</title>
          <style>
            body {
              margin: 0;
              padding: 0;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              background: #000;
            }
            img {
              max-width: 100%;
              max-height: 100vh;
              object-fit: contain;
            }
          </style>
        </head>
        <body>
          <img src="${base64Image}" alt="Document Image">
        </body>
      </html>
    `);
    newWindow.document.close();
  }
}

function changeCase(str: string) {
  return str.replace(/_/g, " ");
}

function CredentialDetails({
  credentialId,
  open,
  toggle,
}: { credentialId: string; open: boolean; toggle: (value?: boolean) => void }) {
  const credential = useFetchCredential(credentialId);
  const [secretKey] = useLocalStorage("SECRET_KEY", "");

  if (!credential.data || !secretKey) return null;

  const result = decrypt(credential.data.content, credential.data.encryptor_public_key, secretKey);
  const content = JSON.parse(result);

  const subject = Object.entries(content.credentialSubject).filter(
    ([key]) => !["emails", "wallets"].includes(key) && !key.endsWith("_file"),
  ) as [string, string][];

  const emails = content.credentialSubject.emails;
  const wallets = content.credentialSubject.wallets;
  const files = (
    Object.entries(content.credentialSubject).filter(([key]) => key.endsWith("_file")) as [
      string,
      string,
    ][]
  ).map(([key, value]) => [key, transformBase85Image(value)]);

  return (
    <DrawerRoot
      open={open}
      placement="end"
      size="xl"
      onOpenChange={() => {
        toggle(false);
      }}
    >
      <DrawerBackdrop />
      <DrawerContent offset={{ base: "0", md: "5" }}>
        <DrawerHeader>
          <DrawerTitle>Credential details</DrawerTitle>
        </DrawerHeader>
        <DrawerBody>
          <Stack>
            <DataListRoot orientation="horizontal" divideY="1px">
              {subject.map(([key, value]) => (
                <DataListItem
                  key={key}
                  pt="4"
                  grow
                  textTransform="uppercase"
                  label={changeCase(key)}
                  value={value}
                />
              ))}

              <DataListItem
                pt="4"
                grow
                alignItems={{
                  base: "flex-start",
                  md: "center",
                }}
                flexDir={{
                  base: "column",
                  md: "row",
                }}
                textTransform="uppercase"
                label="EMAILS"
                value={
                  <List.Root align="center" gap="2">
                    {emails.map(({ address, verified }: { address: string; verified: boolean }) => (
                      <List.Item key={address} alignItems="center" display="inline-flex">
                        {address}
                        {verified ? " (verified)" : ""}
                      </List.Item>
                    ))}
                  </List.Root>
                }
              />
              <DataListItem
                pt="4"
                grow
                alignItems={{
                  base: "flex-start",
                  md: "center",
                }}
                flexDir={{
                  base: "column",
                  md: "row",
                }}
                textTransform="uppercase"
                label="WALLETS"
                value={
                  <List.Root align="center" gap="2">
                    {wallets.map(
                      ({
                        address,
                        currency,
                      }: { address: string; currency: string; verified: boolean }) => (
                        <List.Item
                          key={address}
                          display="inline-flex"
                          alignItems="center"
                          textTransform="uppercase"
                        >
                          {address} ({currency})
                        </List.Item>
                      ),
                    )}
                  </List.Root>
                }
              />
              {files.length > 0 ? (
                <DataListItem
                  pt="4"
                  grow
                  alignItems="start"
                  flexDir="column"
                  label="FILES"
                  value={
                    <List.Root
                      variant="plain"
                      display="flex"
                      flexDirection="row"
                      gap="4"
                      overflowX="auto"
                    >
                      {files.map(([key, value]) => (
                        <List.Item
                          flexShrink="0"
                          key={key}
                          transition="transform 0.2s"
                          cursor="pointer"
                          _hover={{ transform: "scale(1.02)" }}
                          onClick={() => openImageInNewTab(value)}
                        >
                          <Image
                            src={value}
                            alt="Identification document front"
                            rounded="md"
                            loading="lazy"
                            width="120px"
                            height="120px"
                            title="Click to open the image in full size"
                          />
                        </List.Item>
                      ))}
                    </List.Root>
                  }
                />
              ) : null}
            </DataListRoot>
          </Stack>
        </DrawerBody>
        <DrawerFooter>
          <DrawerActionTrigger asChild>
            <Button variant="outline">Close</Button>
          </DrawerActionTrigger>
        </DrawerFooter>
        <DrawerCloseTrigger />
      </DrawerContent>
    </DrawerRoot>
  );
}

function SearchResults({
  results,
  setPage,
  page,
}: { results: GrantsWithFormattedLockedUntil; setPage: (page: number) => void; page: number }) {
  const [credentialId, setCredentialId] = useState("");
  const [openSecretKeyPrompt, toggleSecretKeyPrompt] = useToggle();
  const [openCredentialDetails, toggleCredentialDetails] = useToggle();
  const [secretKey, setSecretKey] = useLocalStorage("SECRET_KEY", "");

  if (!results.records.length) {
    return <EmptyState title="No results found" bg="gray.900" rounded="lg" />;
  }

  const handleOpenCredentialDetails = async (id: string) => {
    setCredentialId(id);

    if (!secretKey) {
      toggleSecretKeyPrompt();
      return;
    }

    toggleCredentialDetails();
  };

  const onKeySubmit = async (secretKey: string) => {
    setSecretKey(secretKey);
    toggleCredentialDetails();
  };

  return (
    <>
      {results.records.map((grant) => (
        <Stack key={crypto.randomUUID()} gap="6" bg="gray.900" p="6" rounded="md">
          <DataListRoot orientation="horizontal" divideY="1px">
            <DataListItem
              alignItems={{
                base: "flex-start",
                md: "center",
              }}
              flexDir={{
                base: "column",
                md: "row",
              }}
              pt="4"
              grow
              label="ID"
              value={grant.dataId}
              truncate
            />
            <DataListItem
              alignItems={{
                base: "flex-start",
                md: "center",
              }}
              flexDir={{
                base: "column",
                md: "row",
              }}
              pt="4"
              grow
              label="Owner ID"
              value={grant.ownerUserId}
              truncate
            />
            <DataListItem
              alignItems={{
                base: "flex-start",
                md: "center",
              }}
              flexDir={{
                base: "column",
                md: "row",
              }}
              pt="4"
              grow
              label="Grantee"
              value={grant.granteeAddress}
              truncate
            />
            <DataListItem
              alignItems={{
                base: "flex-start",
                md: "center",
              }}
              flexDir={{
                base: "column",
                md: "row",
              }}
              pt="4"
              grow
              label="Locked until"
              value={grant.lockedUntil}
            />
          </DataListRoot>
          <Button
            alignSelf={{
              md: "flex-end",
            }}
            onClick={() => handleOpenCredentialDetails(grant.dataId)}
          >
            Credential details
          </Button>
        </Stack>
      ))}
      <Pagination
        count={results.totalCount}
        pageSize={DEFAULT_RECORDS_PER_PAGE}
        setPage={setPage}
        page={page}
      />
      <SecretKeyPrompt
        {...{ open: openSecretKeyPrompt, toggle: toggleSecretKeyPrompt, onSubmit: onKeySubmit }}
      />

      <CredentialDetails
        {...{
          credentialId,
          open: openCredentialDetails,
          toggle: toggleCredentialDetails,
        }}
      />
    </>
  );
}

function Index() {
  const [page, setPage] = useState<number>(1);
  const sdk = useContext(idOSContext);
  const navigate = useNavigate({ from: Route.fullPath });
  const { filter = "" } = Route.useSearch();
  const debouncedSearchTerm = useDebounce(filter, 300);
  const grants = useFetchGrants(page, sdk);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const search = e.target.value;
    navigate({
      search: {
        filter: search,
      },
    });
  };

  const results = useMemo(() => {
    if (!grants.data) return { records: [], totalCount: 0 };
    if (!debouncedSearchTerm) return grants.data;

    const sortedRecords = matchSorter(grants.data.records, debouncedSearchTerm, {
      keys: ["dataId", "owner", "grantee", "lockedUntil"],
    });
    return {
      records: sortedRecords,
      totalCount: grants.data.totalCount,
    };
  }, [debouncedSearchTerm, grants.data]);

  return (
    <Container h="100%">
      <Stack gap="4" h="100%">
        {grants.isFetching ? (
          <Center h="100%" flexDirection="column" gap="2">
            <Spinner />
            <Text>Fetching grants...</Text>
          </Center>
        ) : (
          <Stack gap="4">
            <HStack
              gap="4"
              alignSelf={{ md: "flex-end" }}
              w={{
                base: "full",
                md: "md",
              }}
            >
              <SearchField
                value={filter}
                onChange={handleSearchChange}
                onClear={() =>
                  navigate({
                    search: {},
                  })
                }
              />
              <RefreshButton
                aria-label="Refresh grants list"
                title="Refresh grants list"
                variant="subtle"
                colorPalette="gray"
                onClick={() => grants.refetch()}
              />
            </HStack>
            <SearchResults results={results} setPage={setPage} page={page} />
          </Stack>
        )}
      </Stack>
    </Container>
  );
}
