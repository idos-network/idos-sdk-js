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
import { useAccount, useSwitchChain } from "wagmi";

import { DataError } from "@/components/data-error";
import { DataLoading } from "@/components/data-loading";
import { NoData } from "@/components/no-data";
import { useIdOS } from "@/core/idos";
import { sepolia } from "wagmi/chains";
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
      credentials
        .filter((credential) => !credential.original_id)

        .map((credential) => {
          const fields = credential.public_notes ? JSON.parse(credential.public_notes) : {};

          const public_notes = {
            id: fields.id,
            level: fields.level,
            status: fields.status,
            type: fields.type,
            issuer: fields.issuer,
          };

          return {
            ...credential,
            public_notes: JSON.stringify(public_notes),
          };
        }),
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

const Credentials = () => {
  const credentials = useFetchCredentials();
  const [credentialDetailsId, setCredentialDetalsId] = useState<string | null>(null);
  const [credentialGrantsId, setCredentialGrantsId] = useState<string | null>(null);
  const [credentialToDelete, setCredentialToDelete] = useState<idOSCredentialWithShares | null>(
    null,
  );
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { chain } = useAccount();
  const { switchChainAsync } = useSwitchChain();

  const handleManageGrants = async (credentialId: string) => {
    if (chain?.id !== sepolia.id)
      await switchChainAsync?.({
        chainId: sepolia.id,
      });
    setCredentialGrantsId(credentialId);
  };

  const handleDelete = async (credential: idOSCredentialWithShares) => {
    if (chain?.id !== sepolia.id)
      await switchChainAsync?.({
        chainId: sepolia.id,
      });
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
            <ListItem key={credential.id} id={credential.id}>
              <CredentialCard
                credential={credential}
                onViewDetails={setCredentialDetalsId}
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
            onClose={() => setCredentialDetalsId(null)}
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
