import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useState } from "react";
import { CredentialCard } from "@/components/credentials/credential-card";
import { CredentialsError } from "@/components/credentials/credentials-error";
import { CredentialsPending } from "@/components/credentials/credentials-pending";
import type { idOSCredentialWithShares } from "@/components/credentials/types";
import { credentialsQueryOptions, useFetchCredentials } from "@/lib/queries/credentials";

const CredentialDetails = lazy(() =>
  import("@/components/credentials/credential-details").then((m) => ({
    default: m.CredentialDetails,
  })),
);
const GrantsCenter = lazy(() =>
  import("@/components/credentials/grants-center").then((m) => ({ default: m.GrantsCenter })),
);
const DeleteCredential = lazy(() =>
  import("@/components/credentials/delete-credential").then((m) => ({
    default: m.DeleteCredential,
  })),
);

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
      {activeDialog?.type === "details" && (
        <Suspense>
          <CredentialDetails
            credentialId={activeDialog.credentialId}
            isOpen
            onClose={closeDialog}
          />
        </Suspense>
      )}
      {activeDialog?.type === "grants" && (
        <Suspense>
          <GrantsCenter credentialId={activeDialog.credentialId} isOpen onClose={closeDialog} />
        </Suspense>
      )}
      {activeDialog?.type === "delete" && (
        <Suspense>
          <DeleteCredential credential={activeDialog.credential} isOpen onClose={closeDialog} />
        </Suspense>
      )}
    </>
  );
}

function Credentials() {
  return (
    <div className="flex flex-1 flex-col items-stretch gap-5">
      <div className="flex h-14 items-center justify-between rounded-xl bg-card p-5 lg:h-20">
        <h1 className="block font-bold text-2xl lg:text-3xl">Credentials</h1>
      </div>
      <CredentialsList />
    </div>
  );
}
