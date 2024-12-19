import {
  Center,
  Container,
  HStack,
  Image,
  List,
  Show,
  Spinner,
  Stack,
  Text,
  chakra,
} from "@chakra-ui/react";
import type { idOSCredential } from "@idos-network/idos-sdk";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useToggle } from "@uidotdev/usehooks";
import { matchSorter } from "match-sorter";
import { useDeferredValue, useMemo, useState } from "react";

import { SecretKeyPrompt } from "@/components/secret-key-prompt";
import {
  Button,
  DataListItem,
  DataListRoot,
  DrawerActionTrigger,
  DrawerBackdrop,
  DrawerBody,
  DrawerCloseTrigger,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerRoot,
  DrawerTitle,
  EmptyState,
  PaginationItems,
  PaginationNextTrigger,
  PaginationPrevTrigger,
  PaginationRoot,
  RefreshButton,
  SearchField,
} from "@/components/ui";
import { useSecretKey } from "@/hooks";
import { useIdOS } from "@/idOS.provider";
import { changeCase, decrypt, openImageInNewTab } from "@/utils";

export const Route = createFileRoute("/credentials")({
  component: Credentials,
  validateSearch: (search): { filter?: string; page?: number } => {
    return {
      filter: (search.filter as string) ?? undefined,
      page: Number(search.page) || 1,
    };
  },
});

export const useFetchAllCredentials = ({ enabled }: { enabled: boolean }) => {
  const idOS = useIdOS();
  const [secretKey] = useSecretKey();

  return useQuery({
    queryKey: ["credentials", secretKey],
    queryFn: async () => {
      const credentials = await idOS.data.listAllCredentials();
      const promiseList = credentials.map(async (credential) => {
        const fullCredential = (await idOS.data.get(
          "credentials",
          credential.id,
          false,
        )) as idOSCredential;

        if (!fullCredential) return null;

        try {
          const decrypted = decrypt(
            fullCredential.content,
            fullCredential.encryptor_public_key,
            secretKey,
          );

          return {
            ...fullCredential,
            content: decrypted,
          };
        } catch (error) {
          console.error(`Failed to decrypt/parse credential ${credential.id}:`, error);
          return {
            ...fullCredential,
            content: null,
          };
        }
      });

      const results = await Promise.all(promiseList);
      return results.filter((credential): credential is idOSCredential => credential !== null);
    },
    enabled,
  });
};

function CredentialDetails({
  credential,
  open,
  toggle,
}: { credential: idOSCredential | null; open: boolean; toggle: (value?: boolean) => void }) {
  if (!credential) return null;

  const content = JSON.parse(credential.content);

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

function SearchResults({ results }: { results: idOSCredential[] }) {
  const navigate = useNavigate({ from: Route.fullPath });
  const { page = 1 } = Route.useSearch();
  const [credential, setCredential] = useState<idOSCredential | null>(null);
  const [openSecretKeyPrompt, toggleSecretKeyPrompt] = useToggle();
  const [openCredentialDetails, toggleCredentialDetails] = useToggle();
  const [secretKey, setSecretKey] = useSecretKey();

  const PAGE_SIZE = 20;
  const totalPages = Math.ceil(results.length / PAGE_SIZE);
  const paginatedResults = results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (!results.length) {
    return <EmptyState title="No results found" bg="gray.900" rounded="lg" />;
  }

  const handlePageChange = (newPage: number) => {
    navigate({
      search: (prev) => ({
        ...prev,
        page: newPage,
      }),
    });
  };

  const handleOpenCredentialDetails = async (credential: idOSCredential) => {
    setCredential(credential);

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
    <Stack gap="4">
      {paginatedResults.map((credential) => {
        const publicFields = Object.entries(JSON.parse(credential.public_notes)) as [
          string,
          string,
        ][];

        return (
          <Stack key={credential.id} gap="6" bg="gray.900" p="6" rounded="md">
            <DataListRoot orientation="horizontal" divideY="1px">
              {publicFields.map(([key, value]) => (
                <DataListItem
                  key={key}
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
                  textTransform="uppercase"
                  label={changeCase(key)}
                  value={value}
                  truncate
                />
              ))}
            </DataListRoot>
            <Button
              alignSelf={{
                md: "flex-end",
              }}
              onClick={() => handleOpenCredentialDetails(credential)}
            >
              Credential details
            </Button>
          </Stack>
        );
      })}

      <Show when={totalPages > 1}>
        <Center>
          <PaginationRoot
            count={results.length}
            defaultPage={1}
            pageSize={PAGE_SIZE}
            page={page}
            onPageChange={(details) => handlePageChange(details.page)}
          >
            <HStack>
              <PaginationPrevTrigger />
              <PaginationItems />
              <PaginationNextTrigger />
            </HStack>
          </PaginationRoot>
        </Center>
      </Show>

      <SecretKeyPrompt
        {...{ open: openSecretKeyPrompt, toggle: toggleSecretKeyPrompt, onSubmit: onKeySubmit }}
      />

      <CredentialDetails
        {...{
          credential,
          open: openCredentialDetails,
          toggle: toggleCredentialDetails,
        }}
      />
    </Stack>
  );
}

function Credentials() {
  const navigate = useNavigate({ from: Route.fullPath });
  const { filter = "" } = Route.useSearch();
  const deferredSearchItem = useDeferredValue(filter);
  const [secretKey] = useSecretKey();
  const credentials = useFetchAllCredentials({ enabled: Boolean(secretKey) });

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const search = e.target.value;
    navigate({
      search: {
        filter: search,
        page: 1,
      },
    });
  };

  const results = useMemo(() => {
    if (!credentials.data) return [];
    if (!deferredSearchItem) return credentials.data;

    return matchSorter(credentials.data, deferredSearchItem, {
      keys: ["public_notes", "content"],
      threshold: matchSorter.rankings.CONTAINS,
    });
  }, [deferredSearchItem, credentials.data]);

  return (
    <Container h="100%">
      <Stack gap="4" h="100%">
        {credentials.isFetching ? (
          <Center h="100%" flexDirection="column" gap="2">
            <Spinner />
            <Text>Fetching credentials...</Text>
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
                aria-label="Refresh credentials list"
                title="Refresh credentials list"
                variant="subtle"
                colorPalette="gray"
                onClick={() => credentials.refetch()}
              />
            </HStack>
            <SearchResults results={results} />
          </Stack>
        )}
      </Stack>
    </Container>
  );
}
