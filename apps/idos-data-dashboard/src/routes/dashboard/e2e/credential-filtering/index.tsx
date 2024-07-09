import { HStack, Heading, List, ListItem, Stack, Text, VStack } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";

import { DataError } from "@/components/data-error";
import { DataLoading } from "@/components/data-loading";
import { NoData } from "@/components/no-data";
import { useIdOS } from "@/core/idos";

const credential = {
  credential_level: "basic",
  credential_status: "pending",
  credential_type: "kyc",
  encryption_public_key: "JOZYKxMQrwjH6k1XExsaKx9vm1mN3VLhRwnEexnlCRw",
  human_id: "0b764d0c-457e-483b-9dab-79cd034f3ac5",
  id: "5e901d3a-da38-47fd-9eb2-323fbd2c8254",
  content:
    "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",
};

const useFetchFilteredCredentials = () => {
  const { sdk } = useIdOS();

  return useQuery({
    queryKey: ["e2e-credential-filtering"],
    queryFn: () => sdk.enclave.filterCredentialsByCountries([credential], ["DE"]),
  });
};

export function Component() {
  const credentials = useFetchFilteredCredentials();

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
          Credentials filtered by country (DE)
        </Heading>
      </HStack>

      {credentials.isFetching ? <DataLoading /> : null}

      {credentials.isError ? <DataError onRetry={credentials.refetch} /> : null}

      {credentials.isSuccess ? (
        <>
          {credentials.data.length > 0 ? (
            <List id="credentials-list" display="flex" flexDir="column" gap={2.5} flex={1}>
              {credentials.data.map((credential) => (
                <ListItem key={credential} id={credential}>
                  <Stack gap={14} p={5} bg="neutral.900" rounded="xl">
                    <Text>ID: {credential}</Text>
                  </Stack>
                </ListItem>
              ))}
            </List>
          ) : (
            <NoData title="There are 0 credentials that match the search criteria." />
          )}
        </>
      ) : null}
    </VStack>
  );
}
Component.displayName = "e2e_CredentialFiltering";
