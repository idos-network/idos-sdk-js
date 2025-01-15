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
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

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
} from "@/components/ui";
import { changeCase, openImageInNewTab } from "@/utils";

import { useIdOS } from "@/idOS.provider";
import { useToggle } from "@uidotdev/usehooks";
import { useSignMessage } from "wagmi";

export const Route = createFileRoute("/")({
  component: Index,
  validateSearch: (search): { filter?: string } => {
    return {
      filter: (search.filter as string) ?? undefined,
    };
  },
});

const safeParse = (data: string) => {
  try {
    return JSON.parse(data);
  } catch (e) {
    return null;
  }
};

const useFetchCredentials = () => {
  const idOS = useIdOS();

  return useQuery<idOSCredential[]>({
    queryKey: ["credentials-list"],
    queryFn: async () => {
      const credentials = await idOS.data.list("credentials");
      const promiseList = credentials?.map(async (credential) => {
        const fullCredential = (await idOS.data.get(
          "credentials",
          credential.id,
          false,
        )) as idOSCredential;
        return { ...fullCredential, original_id: credential.original_id };
      });
      const results = await Promise.all(promiseList);
      return results.filter((credential) => !!credential);
    },
    select: (data) =>
      data.filter((credential) => credential.public_notes && !credential.original_id) ?? [],
  });
};

const useFetchCredential = (id: string) => {
  const idOS = useIdOS();
  return useQuery({
    queryKey: ["credential-details", id],
    queryFn: id ? () => idOS.data.get("credentials", id) : skipToken,
    enabled: !!id,
  });
};

function CredentialDetails({
  credentialId,
  open,
  toggle,
}: { credentialId: string; open: boolean; toggle: (value?: boolean) => void }) {
  const credential = useFetchCredential(credentialId);

  if (!credential.data) return null;
  const result = credential.data.content;

  const content = result ? safeParse(result) : { credentialSubject: {} };
  const hasValidContent = !!result;

  const subject = Object.entries(content?.credentialSubject || {}).filter(
    ([key]) => !["emails", "wallets"].includes(key) && !key.endsWith("_file"),
  ) as [string, string][];

  const emails: { address: string; verified: boolean }[] = content?.credentialSubject?.emails || [];
  const wallets: { address: string; currency: string; verified: boolean }[] =
    content.credentialSubject?.wallets || [];
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
          {!hasValidContent ? (
            <Text color="red.500">
              Can't decrypt credential — please make sure you're using the right encryption key
            </Text>
          ) : (
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
                      {emails.map(({ address, verified }) => (
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
                      {wallets.map(({ address, currency }) => (
                        <List.Item
                          key={address}
                          display="inline-flex"
                          alignItems="center"
                          textTransform="uppercase"
                        >
                          {address} ({currency})
                        </List.Item>
                      ))}
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
            </Stack>
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

const CredentialCard = ({
  credential,
  setCredential,
  toggleCredentialDetails,
}: {
  credential: idOSCredential;
  setCredential: (credential: idOSCredential) => void;
  toggleCredentialDetails: (open?: boolean) => void;
}) => {
  const idos = useIdOS();
  const publicFields = Object.entries(safeParse(credential.public_notes)) as [string, string][];
  const [loading, setLoading] = useState(false);
  const { signMessageAsync } = useSignMessage();

  const signMessage = async () => {
    const message = `Sign this message to confirm that you want to grant this app access to this credential.\nHere's a unique nonce: ${crypto.randomUUID()}`;
    const signature = await signMessageAsync({
      message,
    });
    return signature;
  };

  const sendSignedAG = (accessGrant: unknown, signature: string) => {
    // @todo: implement OE1 BE call here
    console.log({ accessGrant, signature });
  };

  const handleGrantAccess = async (credentialId: string) => {
    setLoading(true);
    try {
      const signature = await signMessage();
      const accessGrant = await idos.data.shareCredential(
        credentialId,
        import.meta.env.VITE_DAPP_ENCRYPTION_PUBLIC_KEY,
        {
          granteeAddress: "0xeDC73bFC1c4E748b58ea12e7AB920dc4FccE0A42",
          lockedUntil: Math.floor(Date.now() / 1000) + 10,
        },
      );
      sendSignedAG(accessGrant, signature);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

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
      <HStack w="100%" justifyContent="flex-end">
        <Button
          alignSelf={{
            md: "flex-end",
          }}
          onClick={() => {
            setCredential(credential);
            toggleCredentialDetails();
          }}
        >
          Credential details
        </Button>
        <Button
          bg="purple.300"
          alignSelf={{
            md: "flex-end",
          }}
          loading={loading}
          loadingText="Granting..."
          onClick={() => handleGrantAccess(credential.id)}
        >
          Grant Access
        </Button>
      </HStack>
    </Stack>
  );
};

function SearchResults({
  results,
}: {
  results: idOSCredential[];
}) {
  const [credential, setCredential] = useState<idOSCredential | null>(null);
  const [openCredentialDetails, toggleCredentialDetails] = useToggle();

  if (!results.length) {
    return <EmptyState title="No results found" bg="gray.900" rounded="lg" />;
  }

  return (
    <Stack gap="4">
      {results.map((credential) => (
        <CredentialCard
          key={credential.id}
          credential={credential}
          setCredential={setCredential}
          toggleCredentialDetails={toggleCredentialDetails}
        />
      ))}

      {credential && (
        <CredentialDetails
          credentialId={credential.id}
          open={openCredentialDetails}
          toggle={toggleCredentialDetails}
        />
      )}
    </Stack>
  );
}

function Index() {
  const credentials = useFetchCredentials();

  return (
    <Container h="100%">
      <Stack gap="4" h="100%">
        {credentials.isFetching ? (
          <Center h="100%" flexDirection="column" gap="2">
            <Spinner />
            <Text>Fetching credentials...</Text>
          </Center>
        ) : (
          <SearchResults results={credentials.data || []} />
        )}
      </Stack>
    </Container>
  );
}
