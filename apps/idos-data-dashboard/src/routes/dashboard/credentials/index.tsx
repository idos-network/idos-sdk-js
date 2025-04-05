import {
  HStack,
  Heading,
  IconButton,
  List,
  ListItem,
  VStack,
  useDisclosure,
} from "@chakra-ui/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { RotateCw } from "lucide-react";
import { useState } from "react";

import { DataError } from "@/components/data-error";
import { DataLoading } from "@/components/data-loading";
import { NoData } from "@/components/no-data";
import { useIdOS } from "@/core/idos";
import { CredentialCard } from "./components/credential-card";
import { CredentialDetails } from "./components/credential-details";
import { DeleteCredential } from "./components/delete-credential";
import { GrantsCenter } from "./components/grants-center";
import type { idOSCredentialWithShares } from "./types";

const useFetchCredentials = () => {
  const { sdk } = useIdOS();

  return useQuery({
    queryKey: ["credentials"],
    queryFn: async () => {
      const credentials = await sdk.data.listAllCredentials();
      return credentials.map((credential) => ({
        ...credential,
        shares: credentials
          .filter((_credential) => _credential.original_id === credential.id)
          .map((c) => c.id),
      })) as idOSCredentialWithShares[]; // @todo: remove once we have more type safety in the SDK.
    },
    select: (credentials) =>
      credentials.filter((credential) => !credential.original_id && !!credential.public_notes),
  });
};

const NoCredentials = () => {
  return (
    <NoData title="When you get onboarded to the idOS through an issuer, your credentials will show up here." />
  );
};

const Credentials = () => {
  const credentials = useFetchCredentials();
  const [credentialDetailsId, setCredentialDetailsId] = useState<string | null>(null);
  const [credentialGrantsId, setCredentialGrantsId] = useState<string | null>(null);
  const [credentialToDelete, setCredentialToDelete] = useState<idOSCredentialWithShares | null>(
    null,
  );
  const { isOpen, onOpen, onClose } = useDisclosure();

  const handleManageGrants = async (credentialId: string) => setCredentialGrantsId(credentialId);

  const handleDelete = async (credential: idOSCredentialWithShares) => {
    setCredentialToDelete(credential);
    onOpen();
  };

  const handleClose = () => {
    setCredentialToDelete(null);
    onClose();
  };

  if (credentials.isFetching) {
    return <DataLoading />;
  }

  if (credentials.isError) {
    return <DataError onRetry={credentials.refetch} />;
  }

  if (credentials.isSuccess) {
    return (
      <>
        <List id="credentials-list" display="flex" flexDir="column" gap={2.5} flex={1}>
          {credentials.data.map((credential) => (
            // biome-ignore lint/a11y/useSemanticElements: <explanation>
            <ListItem key={credential.id} id={credential.id} role="listitem">
              <CredentialCard
                credential={credential}
                onViewDetails={setCredentialDetailsId}
                onManageGrants={handleManageGrants}
                onDelete={handleDelete}
              />
            </ListItem>
          ))}
        </List>
        {credentialDetailsId ? (
          <CredentialDetails
            credentialId={credentialDetailsId}
            isOpen={!!credentialDetailsId}
            onClose={() => setCredentialDetailsId(null)}
          />
        ) : null}

        {credentialGrantsId ? (
          <GrantsCenter
            credentialId={credentialGrantsId}
            isOpen={!!credentialGrantsId}
            onClose={() => {
              setCredentialGrantsId(null);
            }}
          />
        ) : null}

        {credentialToDelete ? (
          <DeleteCredential credential={credentialToDelete} isOpen={isOpen} onClose={handleClose} />
        ) : null}
      </>
    );
  }
};

export function Component() {
  const { hasProfile } = useIdOS();
  const queryClient = useQueryClient();

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
          Credentials
        </Heading>
        <IconButton
          aria-label="Refresh credentials"
          icon={<RotateCw size={18} />}
          onClick={() => {
            queryClient.refetchQueries({
              queryKey: ["credentials"],
            });
          }}
        />
      </HStack>
      {hasProfile ? <Credentials /> : <NoCredentials />}
    </VStack>
  );
}
Component.displayName = "Credentials";
