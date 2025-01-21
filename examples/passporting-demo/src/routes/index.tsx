import { Box, Center, Heading, Spinner, Text, VStack } from "@chakra-ui/react";
import type { idOSCredential } from "@idos-network/idos-sdk";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Suspense, useState } from "react";

import { Button, DataListItem, DataListRoot } from "@/components/ui";
import { useIdOS } from "@/idOS.provider";
import { useAccount, useSignMessage } from "wagmi";

const CREDENTIAL_ID = "5c9e2818-a975-4d15-afad-ea896be39579";

export const Route = createFileRoute("/")({
  component: Index,
});

const useFetchCredential = (id: string) => {
  const idOS = useIdOS();

  return useSuspenseQuery({
    queryKey: ["credential-details", id],
    queryFn: () => idOS.data.get<idOSCredential>("credentials", id, false),
  });
};

function MatchingCredential() {
  // We assume that the credential that we need has the hardcoded `id`.
  // In real life, we need to list all the credentials and find the one that we need.
  // That can be done by searching the `public_notes` field for values like `type=human` etc.
  const credential = useFetchCredential(CREDENTIAL_ID);
  const idOS = useIdOS();
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [isPending, setIsPending] = useState(false);

  const publicNotes = Object.entries(
    JSON.parse(credential.data?.public_notes ?? "{}") as Record<string, string>,
  ).filter(([key]) => key !== "id");

  const handleCredentialDuplicateProcess = async () => {
    if (!credential.data) return;

    setIsPending(true);

    const contentHash = await idOS.data.getCredentialContentSha256Hash(credential.data.id);
    const lockedUntil = 0;

    const { id } = await idOS.data.shareCredential(
      credential.data.id,
      import.meta.env.VITE_GRANTEE_ENCRYPTION_PUBLIC_KEY,
      {
        granteeAddress: import.meta.env.VITE_GRANTEE_IDENTIFIER_PUBLIC_KEY,
        lockedUntil: 0,
      },
    );

    // Create the DAG payload
    const dag = {
      dag_owner_wallet_identifier: address as string,
      dag_grantee_wallet_identifier: import.meta.env.VITE_GRANTEE_IDENTIFIER_PUBLIC_KEY,
      dag_data_id: id,
      dag_locked_until: lockedUntil,
      dag_content_hash: contentHash,
    };

    // Request a message to sign that will be used in the DAG payload
    const message: string = await idOS.data.requestDAGSignature(dag);

    // Sign the message
    const signature = await signMessageAsync({ message });

    // Transmit the DAG to the given URL
    await idOS.data.transmitDAG(import.meta.env.VITE_OE_URL, {
      ...dag,
      dag_signature: signature,
    });

    setIsPending(false);
  };

  return (
    <VStack gap="5" alignItems="stretch">
      <Heading
        as="h3"
        fontSize={{
          base: "xl",
          md: "2xl",
        }}
      >
        We have found a matching credential that we can reuse:
      </Heading>
      <VStack alignItems="stretch" gap="4">
        <DataListRoot
          orientation="horizontal"
          bg="gray.900"
          border="2px solid"
          borderColor="gray.800"
          p="6"
          rounded="md"
          divideY="1px"
        >
          {publicNotes.map(([key, value]) => (
            <DataListItem
              key={key}
              label={key}
              value={value}
              _first={{
                pt: 0,
              }}
              css={{
                pt: "4",
                "& dt": {
                  textTransform: "capitalize",
                  fontWeight: "semibold",
                },
                "& dd": {
                  justifyContent: "flex-end",
                  textTransform: "uppercase",
                  color: "green.200",
                },
              }}
              justifyContent="space-between"
            />
          ))}
        </DataListRoot>
        <Box>
          <Text color="green.500">
            In order to proceed, we need to request an encrypted duplicate of this credential.
          </Text>
          <Text color="green.500">Click the button below to start the process.</Text>
        </Box>
        <Button
          onClick={handleCredentialDuplicateProcess}
          loading={isPending}
          loadingText="Requesting credential duplicate"
        >
          Request credential duplicate
        </Button>
      </VStack>
    </VStack>
  );
}

function Index() {
  return (
    <Center h="100%" flexDirection="column" gap="2">
      <Suspense
        fallback={
          <Center h="100%" flexDirection="column" gap="2">
            <Spinner />
            <Text>Fetching matching credential...</Text>
          </Center>
        }
      >
        <MatchingCredential />
      </Suspense>
    </Center>
  );
}
