import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CredentialCard } from "@/components/credentials/credential-card";
import { CredentialDetails } from "@/components/credentials/credential-details";
import { CredentialsError } from "@/components/credentials/credentials-error";
import { CredentialsPending } from "@/components/credentials/credentials-pending";
import { DeleteCredential } from "@/components/credentials/delete-credential";
import { GrantsCenter } from "@/components/credentials/grants-center";
import type { idOSCredentialWithShares } from "@/components/credentials/types";
import { credentialsQueryOptions, useFetchCredentials } from "@/lib/queries/credentials";

type ActiveDialog =
  | { type: "details"; credentialId: string }
  | { type: "grants"; credentialId: string }
  | { type: "delete"; credential: idOSCredentialWithShares }
  | null;

export const Route = createFileRoute("/")({
  component: Credentials,
  staticData: { breadcrumb: "Credentials" },
  pendingComponent: CredentialsPending,
  errorComponent: CredentialsError,
  loader: ({ context: { queryClient } }) => queryClient.ensureQueryData(credentialsQueryOptions()),
});

function CredentialsList() {
  const { data: credentials } = useFetchCredentials();
  const [activeDialog, setActiveDialog] = useState<ActiveDialog>(null);
  const closeDialog = () => setActiveDialog(null);

  return (
    <>
      <ul id="credentials-list" className="flex flex-1 flex-col gap-5">
        {credentials.map((credential) => (
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

function Credentials() {
  return (
    <div className="flex flex-1 flex-col items-stretch gap-5">
      <div className="flex h-20 items-center justify-between rounded-xl bg-card p-5">
        <h1 className="block font-bold text-2xl md:text-3xl">Credentials</h1>
      </div>
      <CredentialsList />
    </div>
  );
}
