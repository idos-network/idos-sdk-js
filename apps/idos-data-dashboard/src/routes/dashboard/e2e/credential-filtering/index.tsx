import { HStack, Heading, List, ListItem, Stack, Text, VStack } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";

import { DataError } from "@/components/data-error";
import { DataLoading } from "@/components/data-loading";
import { NoData } from "@/components/no-data";
import { useIdOS } from "@/core/idos";

const useFetchFilteredCredentials = () => {
  const { sdk } = useIdOS();

  return useQuery({
    queryKey: ["e2e-credential-filtering"],
    queryFn: () => sdk.data.listCredentialsFilteredByCountries(["DE"]),
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
