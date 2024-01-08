import { HStack, Heading, List, ListItem, VStack } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";

import { DataError } from "@/components/data-error";
import { DataLoading } from "@/components/data-loading";
import { NoData } from "@/components/no-data";
import { useIdOS } from "@/core/idos";
import { CredentialCard } from "./components/credential-card";
import { idOSCredential } from "./types";

const useFetchCredentials = () => {
  const { sdk, hasProfile } = useIdOS();

  return useQuery({
    queryKey: ["credentials"],
    queryFn: ({ queryKey: [tableName] }) => sdk.data.list<idOSCredential>(tableName),
    enabled: hasProfile
  });
};

const NoCredentials = () => {
  return (
    <NoData
      title="You have 0 credentials added."
      subtitle="Create your first credential and store it on the idOS."
      cta="Add a credential"
    />
  );
};

const CredentialsList = () => {
  const credentials = useFetchCredentials();

  if (credentials.isLoading) {
    return <DataLoading />;
  }

  if (credentials.isError) {
    return <DataError onRetry={credentials.refetch} />;
  }

  if (credentials.isSuccess) {
    return (
      <List display="flex" flexDir="column" gap={2.5} flex={1}>
        {credentials.data.map((credential) => (
          <ListItem key={credential.id}>
            <CredentialCard credential={credential} />
          </ListItem>
        ))}
      </List>
    );
  }
};

export function Component() {
  const { hasProfile } = useIdOS();

  return (
    <VStack align="stretch" flex={1} gap={2.5}>
      <HStack
        justifyContent="space-between"
        h={{
          base: 14,
          lg: 20
        }}
        p={5}
        bg="neutral.900"
        rounded="xl"
      >
        <Heading
          as="h1"
          fontSize={{
            base: "x-large",
            lg: "xx-large"
          }}
        >
          Credentials
        </Heading>
      </HStack>
      {hasProfile ? <CredentialsList /> : <NoCredentials />}
    </VStack>
  );
}
Component.displayName = "Credentials";
