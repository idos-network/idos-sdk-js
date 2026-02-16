import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CredentialCard } from "@/components/credentials/credential-card";
import { CredentialDetails } from "@/components/credentials/credential-details";
import { DeleteCredential } from "@/components/credentials/delete-credential";
import { GrantsCenter } from "@/components/credentials/grants-center";
import type { idOSCredentialWithShares } from "@/components/credentials/types";
import { DataError } from "@/components/data-error";
import { DataLoading } from "@/components/data-loading";
import { useFetchCredentials } from "@/lib/queries/credentials";

type ActiveDialog =
  | { type: "details"; credentialId: string }
  | { type: "grants"; credentialId: string }
  | { type: "delete"; credential: idOSCredentialWithShares }
  | null;

export const Route = createFileRoute("/")({
  component: Credentials,
  staticData: { breadcrumb: "Credentials" },
});

function CredentialsList() {
  const credentials = useFetchCredentials();
  const [activeDialog, setActiveDialog] = useState<ActiveDialog>(null);
  const closeDialog = () => setActiveDialog(null);

  if (credentials.isFetching) {
    return <DataLoading />;
  }

  if (credentials.isError) {
    return <DataError onRetry={credentials.refetch} />;
  }

  if (credentials.isSuccess) {
    return (
      <>
        <ul id="credentials-list" className="flex flex-col gap-5 flex-1">
          {credentials.data.map((credential) => (
            <li key={credential.id} id={credential.id} className="list-none">
              <CredentialCard
                credential={credential}
                onViewDetails={(id) => setActiveDialog({ type: "details", credentialId: id })}
                onManageGrants={(id) => setActiveDialog({ type: "grants", credentialId: id })}
                onDelete={(credential) => setActiveDialog({ type: "delete", credential })}
              />
            </li>
          ))}
        </ul>
        <CredentialDetails
          credentialId={activeDialog?.type === "details" ? activeDialog.credentialId : ""}
          isOpen={activeDialog?.type === "details"}
          onClose={closeDialog}
        />
        <GrantsCenter
          credentialId={activeDialog?.type === "grants" ? activeDialog.credentialId : ""}
          isOpen={activeDialog?.type === "grants"}
          onClose={closeDialog}
        />
        <DeleteCredential
          credential={activeDialog?.type === "delete" ? activeDialog.credential : null}
          isOpen={activeDialog?.type === "delete"}
          onClose={closeDialog}
        />
      </>
    );
  }
}

function Credentials() {
  return (
    <div className="flex flex-col items-stretch flex-1 gap-5">
      <div className="flex justify-between items-center p-5 h-20 bg-neutral-900 rounded-xl">
        <h1 className="block text-2xl md:text-3xl font-bold">Credentials</h1>
      </div>
      <CredentialsList />
    </div>
  );
}
