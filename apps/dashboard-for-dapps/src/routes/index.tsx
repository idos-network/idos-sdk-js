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
  chakra,
} from "@chakra-ui/react";

import type { idOSCredential } from "@idos-network/idos-sdk";
import { skipToken, useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useDebounce, useToggle } from "@uidotdev/usehooks";
import { matchSorter } from "match-sorter";
import { useMemo, useState } from "react";
import { useAccount } from "wagmi";

import { SecretKeyPrompt } from "@/components/secret-key-prompt";
import {
  Button,
  DataListItem,
  DataListRoot,
  DrawerActionTrigger,
  DrawerBackdrop,
  DrawerCloseTrigger,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerRoot,
  EmptyState,
  RefreshButton,
  SearchField,
} from "@/components/ui";
import { useSecretKey } from "@/hooks";
import { useIdOS } from "@/idOS.provider";
import { changeCase, decrypt, openImageInNewTab } from "@/utils";

export const Route = createFileRoute("/")({
  component: Index,
  validateSearch: (search): { filter?: string } => {
    return {
      filter: (search.filter as string) ?? undefined,
    };
  },
});

const useFetchGrants = () => {
  const idOS = useIdOS();
  const { address } = useAccount();

  return useQuery({
    queryKey: ["grants"],
    queryFn: () =>
      idOS.grants.list({
        granteeAddress: address,
      }),
    select: (data) =>
      data.map((grant) => ({
        ...grant,
        lockedUntil:
          grant.lockedUntil === 0
            ? "Unlocked"
            : Intl.DateTimeFormat("en-US", {
                dateStyle: "full",
                timeStyle: "short",
              }).format(grant.lockedUntil * 1000),
      })),
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

function CredentialDetails({
  credentialId,
  open,
  toggle,
}: { credentialId: string; open: boolean; toggle: (value?: boolean) => void }) {
  const credential = useFetchCredential(credentialId);
  const [secretKey] = useSecretKey();

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
  ).map(([key, value]) => [key, value]);

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
                          <chakra.button className="button">
                            <Image
                              src={value}
                              alt="Identification document front"
                              rounded="md"
                              loading="lazy"
                              width="120px"
                              height="120px"
                              title="Click to open the image in full size"
                            />
                          </chakra.button>
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

function SearchResults({ results }: { results: GrantsWithFormattedLockedUntil }) {
  const [credentialId, setCredentialId] = useState("");
  const [openSecretKeyPrompt, toggleSecretKeyPrompt] = useToggle();
  const [openCredentialDetails, toggleCredentialDetails] = useToggle();
  const [secretKey, setSecretKey] = useSecretKey();

  if (!results.length) {
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
      {results.map((grant) => (
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
              label="Owner"
              value={grant.ownerAddress}
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
  const navigate = useNavigate({ from: Route.fullPath });
  const { filter = "" } = Route.useSearch();
  const debouncedSearchTerm = useDebounce(filter, 300);
  const grants = useFetchGrants();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const search = e.target.value;
    navigate({
      search: {
        filter: search,
      },
    });
  };

  const results = useMemo(() => {
    if (!grants.data) return [];
    if (!debouncedSearchTerm) return grants.data;

    return matchSorter(grants.data, debouncedSearchTerm, {
      keys: ["dataId", "owner", "grantee", "lockedUntil"],
    });
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
            <SearchResults results={results} />
          </Stack>
        )}
      </Stack>
    </Container>
  );
}
