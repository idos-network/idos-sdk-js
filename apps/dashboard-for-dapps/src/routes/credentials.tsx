import { Container, chakra, Image, List, Spinner } from "@chakra-ui/react";
import type { idOSCredential } from "@idos-network/credentials/types";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useToggle } from "@uidotdev/usehooks";
import { matchSorter } from "match-sorter";
import { useDeferredValue, useMemo, useState } from "react";
import invariant from "tiny-invariant";
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
import { changeCase, decrypt, isKeyFile, openImageInNewTab, transformBase85Image } from "@/utils";

export const Route = createFileRoute("/credentials")({
  component: Credentials,
  validateSearch: (search): { filter?: string; page?: number } => {
    return {
      filter: (search.filter as string) ?? undefined,
      page: Number(search.page) || 1,
    };
  },
});

export const safeParse = (json?: string) => {
  try {
    return JSON.parse(json ?? "");
  } catch (_e) {
    return null;
  }
};

export const useListCredentials = () => {
  const idOS = useIdOS();

  return useQuery({
    queryKey: ["credentials-list"],
    queryFn: async () => {
      invariant(idOS.state === "logged-in", "Invalid `idOSClient` state when fetching credentials");

      const credentials = await idOS.getAllCredentials();

      const promiseList = credentials?.map(async (credential) => {
        const fullCredential = await idOS.getCredentialById(credential.id);
        return {
          ...(fullCredential as idOSCredential),
          original_id: credential.original_id,
        } as idOSCredential;
      });

      const results = await Promise.all(promiseList);

      return results.filter((credential): credential is idOSCredential => !!credential);
    },
    select: (data) =>
      data.filter((credential) => credential.public_notes && !credential.original_id) ?? [],
  });
};

export const useDecryptAllCredentials = ({
  enabled,
  credentials,
}: {
  enabled: boolean;
  credentials: idOSCredential[];
}) => {
  const [secretKey] = useSecretKey();

  return useQuery({
    queryKey: ["credentials", secretKey, credentials.length],
    queryFn: async () => {
      const promiseList = credentials?.map(async (credential) => {
        if (!credential) return null;
        if (!secretKey) return credential;

        try {
          const decrypted = decrypt(credential.content, credential.encryptor_public_key, secretKey);

          return {
            ...credential,
            content: decrypted,
          };
        } catch (error) {
          console.error(`Failed to decrypt/parse credential with id: ${credential.id}:`, error);
          return {
            ...credential,
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
  setCredential,
  toggle,
}: {
  credential: idOSCredential | null;
  open: boolean;
  toggle: (value?: boolean) => void;
  setCredential: (credential: idOSCredential | null) => void;
}) {
  const hasValidContent = safeParse(credential?.content)?.credentialSubject;
  const content = hasValidContent ? safeParse(credential?.content) : { credentialSubject: {} };

  const subject = Object.entries(content.credentialSubject || {}).filter(
    ([key]) => !["emails", "wallets"].includes(key) && !isKeyFile(key),
  ) as [string, string][];

  const emails = content.credentialSubject?.emails || [];
  const wallets = content.credentialSubject?.wallets || [];

  const files = (
    Object.entries(content.credentialSubject).filter(([key]) => isKeyFile(key)) as [
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
        setCredential(null);
      }}
    >
      <DrawerBackdrop />
      <DrawerContent offset={{ base: "0", md: "5" }}>
        <DrawerHeader>
          <DrawerTitle>Credential details</DrawerTitle>
        </DrawerHeader>
        <DrawerBody>
          {!hasValidContent ? (
            <span className="text-red-500">
              Can't decrypt credential — please make sure you're using the right encryption key
            </span>
          ) : (
            <div className="flex flex-col gap-4">
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
                      {emails.map(
                        ({ address, verified }: { address: string; verified: boolean }) => (
                          <List.Item key={address} alignItems="center" display="inline-flex">
                            {address}
                            {verified ? " (verified)" : ""}
                          </List.Item>
                        ),
                      )}
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
                        }: {
                          address: string;
                          currency: string;
                          verified: boolean;
                        }) => (
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
                            onClick={() => openImageInNewTab(transformBase85Image(value))}
                          >
                            <chakra.button className="button">
                              <Image
                                src={transformBase85Image(value)}
                                alt="Image from credential"
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
            </div>
          )}
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
  toggleSecretKeyPrompt,
  toggleCredentialDetails,
  openCredentialDetails,
}: {
  results: idOSCredential[];
  openCredentialDetails: boolean;
  toggleSecretKeyPrompt: (open?: boolean) => void;
  toggleCredentialDetails: (open?: boolean) => void;
}) {
  const navigate = useNavigate({ from: Route.fullPath });
  const { page = 1 } = Route.useSearch();
  const [credential, setCredential] = useState<idOSCredential | null>(null);
  const [secret] = useSecretKey();

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

  return (
    <div className="flex flex-col gap-4">
      {paginatedResults.map((credential) => {
        const publicFields = Object.entries(safeParse(credential.public_notes)) as [
          string,
          string,
        ][];

        return (
          <div key={credential.id} className="flex flex-col gap-6 bg-gray-900 p-6 rounded-md">
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
              onClick={() => {
                setCredential(credential);
                if (!secret) {
                  toggleSecretKeyPrompt();
                  return;
                }
                toggleCredentialDetails();
              }}
            >
              Credential details
            </Button>
          </div>
        );
      })}

      {totalPages > 1 && (
        <div className="flex justify-center">
          <PaginationRoot
            count={results.length}
            defaultPage={1}
            pageSize={PAGE_SIZE}
            page={page}
            onPageChange={(details) => handlePageChange(details.page)}
          >
            <div className="flex items-center gap-2">
              <PaginationPrevTrigger />
              <PaginationItems />
              <PaginationNextTrigger />
            </div>
          </PaginationRoot>
        </div>
      )}

      {credential && (
        <CredentialDetails
          setCredential={setCredential}
          {...{
            credential,
            open: openCredentialDetails,
            toggle: toggleCredentialDetails,
          }}
        />
      )}
    </div>
  );
}

function Credentials() {
  const queryClient = useQueryClient();
  const navigate = useNavigate({ from: Route.fullPath });
  const { filter = "" } = Route.useSearch();
  const deferredSearchItem = useDeferredValue(filter);
  const [, setSecretKey] = useSecretKey();

  const credentialsList = useListCredentials();

  const decryptedCredentials = useDecryptAllCredentials({
    enabled: !!credentialsList.data?.length,
    credentials: credentialsList.data ?? ([] as idOSCredential[]),
  });

  const [openSecretKeyPrompt, toggleSecretKeyPrompt] = useToggle(false);
  const [openCredentialDetails, toggleCredentialDetails] = useToggle();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const search = e.target.value;
    navigate({
      search: {
        filter: search,
        page: 1,
      },
    });
  };

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({
      queryKey: ["credentials", "credentials-list"],
    });
    credentialsList.refetch();
  };

  const onKeySubmit = (secretKey: string) => {
    setSecretKey(secretKey);
  };

  const results = useMemo(() => {
    if (!decryptedCredentials.data) return [];
    if (!deferredSearchItem) return decryptedCredentials.data;
    return matchSorter(decryptedCredentials.data || [], deferredSearchItem, {
      keys: ["public_notes", "content"],
      threshold: matchSorter.rankings.CONTAINS,
    });
  }, [deferredSearchItem, decryptedCredentials.data]);

  return (
    <Container h="100%">
      <div className="flex flex-col gap-4 h-full">
        {
          <>
            {credentialsList.isFetching ? (
              <div className="flex h-full flex-col gap-2">
                <Spinner />
                <span>Fetching credentials...</span>
              </div>
            ) : decryptedCredentials.isFetching ? (
              <div className="flex h-full flex-col gap-2">
                <Spinner />
                <span>Decrypting credentials...</span>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="flex justify-between">
                  <Button onClick={() => setSecretKey("")} variant="subtle" colorPalette="gray">
                    Reset Secret Key
                  </Button>
                  <div className="flex gap-4 self-end w-full md:w-md">
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
                      onClick={handleRefresh}
                    />
                  </div>
                </div>
                <SearchResults
                  results={results}
                  toggleSecretKeyPrompt={toggleSecretKeyPrompt}
                  openCredentialDetails={openCredentialDetails}
                  toggleCredentialDetails={toggleCredentialDetails}
                />
              </div>
            )}
            <SecretKeyPrompt
              credentialSample={results[0]}
              {...{
                open: openSecretKeyPrompt,
                toggle: toggleSecretKeyPrompt,
                onSubmit: onKeySubmit,
              }}
            />
          </>
        }
      </div>
    </Container>
  );
}
