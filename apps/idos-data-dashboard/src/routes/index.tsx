import { matchSorter } from "match-sorter";
import { lazy, Suspense, useDeferredValue, useMemo, useState } from "react";
import { useSearchParams } from "react-router";

import type { idOSCredentialWithShares } from "@/components/credentials/types";

import { CredentialCard } from "@/components/credentials/credential-card";
import { SearchField } from "@/components/ui/search-field";
import { useFetchCredentials } from "@/lib/queries/credentials";

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

function CredentialsList() {
  const { data: credentials } = useFetchCredentials();
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get("q") ?? "";
  const deferredSearch = useDeferredValue(search);
  const [activeDialog, setActiveDialog] = useState<ActiveDialog>(null);
  const closeDialog = () => setActiveDialog(null);

  const results = useMemo(() => {
    if (!deferredSearch) return credentials;
    return matchSorter(credentials, deferredSearch, {
      keys: [(item) => item.public_notes ?? ""],
      threshold: matchSorter.rankings.CONTAINS,
    });
  }, [deferredSearch, credentials]);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
      <SearchField
        value={search}
        onChange={(e) => {
          const value = e.target.value;
          setSearchParams(value ? { q: value } : {}, { replace: true });
        }}
        onClear={() => setSearchParams({}, { replace: true })}
      />
      <p className="text-muted-foreground text-sm">
        {results.length} {results.length === 1 ? "Credential" : "Credentials"} found
      </p>
      {results.length > 0 ? (
        <ul id="credentials-list" className="flex flex-1 flex-col gap-5">
          {results.map((credential) => (
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
      ) : (
        <p className="text-muted-foreground py-8 text-center text-sm">
          {deferredSearch ? "No credentials found." : "No credentials yet."}
        </p>
      )}
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
    </div>
  );
}

export default function Credentials() {
  return (
    <div className="flex flex-1 flex-col items-stretch gap-5">
      <div className="bg-card flex h-14 items-center justify-between rounded-xl p-5 lg:h-20">
        <h1 className="block text-2xl font-bold lg:text-3xl">My Data</h1>
      </div>
      <CredentialsList />
    </div>
  );
}
