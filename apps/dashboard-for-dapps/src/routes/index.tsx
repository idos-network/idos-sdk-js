import { Center, Code, Container, HStack, Spinner, Stack, Text } from "@chakra-ui/react";
import type { idOSCredential } from "@idos-network/idos-sdk";
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
  EmptyState,
  Field,
  PasswordInput,
  RefreshButton,
  SearchField,
} from "@idos-network/ui-kit";
import * as Base64Codec from "@stablelib/base64";
import * as Utf8Codec from "@stablelib/utf8";
import { skipToken, useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useDebounce, useToggle } from "@uidotdev/usehooks";
import { matchSorter } from "match-sorter";
import nacl from "tweetnacl";
import { useAccount } from "wagmi";

import { useIdOS } from "@/idOS.provider";
import { useMemo, useRef, useState } from "react";

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
        grantee: address,
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

async function decrypt(b64FullMessage: string, b64SenderPublicKey: string, secretKey: string) {
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

function CredentialDetails({
  content,
  open,
  toggle,
}: { content: string; open: boolean; toggle: (value?: boolean) => void }) {
  if (!content) return null;

  return (
    <DialogRoot
      open={open}
      placement="center"
      size="lg"
      onOpenChange={() => {
        toggle(false);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Credential details</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <Code color="green.500" padding="4" w="full" overflow="auto">
            <pre>{content}</pre>
          </Code>
        </DialogBody>
        <DialogFooter>
          <DialogActionTrigger asChild>
            <Button variant="outline">Close</Button>
          </DialogActionTrigger>
        </DialogFooter>
        <DialogCloseTrigger />
      </DialogContent>
    </DialogRoot>
  );
}

function SearchResults({ results }: { results: GrantsWithFormattedLockedUntil }) {
  const [id, setId] = useState("");
  const [open, toggle] = useToggle();
  const [openDetails, toggleDetails] = useToggle();
  const credential = useFetchCredential(id);
  const [content, setContent] = useState("");

  if (!results.length) {
    return <EmptyState title="No results found" bg="gray.900" rounded="lg" />;
  }

  const onKeySubmit = async (secretKey: string) => {
    if (!credential.data) return;
    const content = await decrypt(
      credential.data.content,
      credential.data.encryption_public_key,
      secretKey,
    );
    setContent(content);
    toggleDetails();
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
              value={grant.owner}
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
              value={grant.grantee}
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
            loading={credential.isFetching}
            onClick={() => {
              setId(grant.dataId);
              toggle();
            }}
          >
            Credential details
          </Button>
        </Stack>
      ))}
      <SecretKeyPrompt {...{ open, toggle, onSubmit: onKeySubmit }} />
      <CredentialDetails content={content} open={openDetails} toggle={toggleDetails} />
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
