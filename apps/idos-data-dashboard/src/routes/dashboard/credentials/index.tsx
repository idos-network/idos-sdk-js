import { useQuery, useQueryClient } from "@tanstack/react-query";
import { RotateCwIcon } from "lucide-react";
import { useState } from "react";
import { DataError } from "@/components/data-error";
import { DataLoading } from "@/components/data-loading";
import { NoData } from "@/components/no-data";
import { Button } from "@/components/ui/button";
import useDisclosure from "@/hooks/useDisclosure";
import { useIdOS } from "@/idOS.provider";
import { CredentialCard } from "./components/credential-card";
import { CredentialDetails } from "./components/credential-details";
import { DeleteCredential } from "./components/delete-credential";
import { GrantsCenter } from "./components/grants-center";
import type { idOSCredentialWithShares } from "./types";

const useFetchCredentials = () => {
  const idOSClient = useIdOS();

  return useQuery({
    queryKey: ["credentials"],
    queryFn: async () => {
      const credentials = await idOSClient.getAllCredentials();
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
        <ul id="credentials-list" className="flex flex-1 flex-col gap-2.5">
          {credentials.data.map((credential) => (
            <li key={credential.id} id={credential.id} className="list-none">
              <CredentialCard
                credential={credential}
                onViewDetails={setCredentialDetailsId}
                onManageGrants={handleManageGrants}
                onDelete={handleDelete}
              />
            </li>
          ))}
        </ul>
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

export function CredentialsSection() {
  const idOSClient = useIdOS();
  const queryClient = useQueryClient();

  if (idOSClient.state !== "logged-in") return <NoCredentials />;

  return (
    <div className="flex flex-1 flex-col items-stretch gap-2.5">
      <div className="flex items-center justify-between rounded-xl bg-neutral-900 p-5">
        <h1 className="block font-bold! text-2xl! md:text-3xl!">Credentials</h1>

        <Button
          variant="secondary"
          aria-label="Refresh credentials"
          onClick={() => {
            queryClient.refetchQueries({
              queryKey: ["credentials"],
            });
          }}
        >
          <RotateCwIcon size={18} />
        </Button>
      </div>
      <Credentials />
    </div>
  );
}
