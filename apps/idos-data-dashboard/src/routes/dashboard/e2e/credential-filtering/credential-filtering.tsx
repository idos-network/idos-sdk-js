import { Button, ButtonGroup, HStack, Heading, Stack, Text, VStack } from "@chakra-ui/react";
import { useMutation } from "@tanstack/react-query";
import { sepolia } from "viem/chains";
import { useSwitchChain } from "wagmi";

import { DataError } from "@/components/data-error";
import { DataLoading } from "@/components/data-loading";
import { useIdOS } from "@/core/idos";

const useShareMatchingCredential = () => {
  const { address, sdk } = useIdOS();

  return useMutation({
    mutationFn: () =>
      sdk.grants.shareMatchingEntry(
        "credentials",
        {
          credential_level: "basic",
          credential_type: "kyc",
        },
        {
          pick: {
            "credentialSubject.identification_document_country": "DE",
          },
          omit: {},
        },
        address as string,
        0,
        "zleIscgvb3usjyVqR4OweNM2oXwmzADJVO3g7byuGk8=",
      ),
  });
};

export function Component() {
  const share = useShareMatchingCredential();
  const { switchChainAsync } = useSwitchChain();

  const onShare = async () => {
    await share.mutateAsync();
  };

  return (
    <VStack align="stretch" flex={1} gap={2.5}>
      <HStack
        justifyContent="space-between"
        h={{
          base: 14,
          lg: 20,
        }}
        p={5}
        bg="neutral.900"
        rounded="xl"
      >
        <Heading
          as="h1"
          fontSize={{
            base: "x-large",
            lg: "xx-large",
          }}
        >
          Share a matching credential
        </Heading>
        <ButtonGroup>
          <Button
            id="switch-chain-button"
            onClick={async () =>
              await switchChainAsync({
                chainId: sepolia.id,
              })
            }
          >
            Switch network
          </Button>
          <Button id="share-matching-credential-button" onClick={onShare}>
            Share
          </Button>
        </ButtonGroup>
      </HStack>
      {share.isPending ? <DataLoading /> : null}
      {share.isError ? (
        <DataError
          onRetry={async () => {
            await share.mutateAsync();
          }}
        />
      ) : null}
      {share.isSuccess ? (
        <Stack id="transaction" gap={14} p={5} bg="neutral.900" rounded="xl">
          <Text id="transaction-id">Transaction ID: {share.data.transactionId}</Text>
        </Stack>
      ) : null}
    </VStack>
  );
}
Component.displayName = "e2e_CredentialFiltering";
