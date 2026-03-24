import { SearchSlashIcon, SendIcon } from "lucide-react";
import { matchSorter } from "match-sorter";
import { lazy, Suspense, useDeferredValue, useMemo, useState } from "react";
import { useSearchParams } from "react-router";

import type { SharedGrant } from "@/components/credentials/types";

import { SharedGrantCard } from "@/components/credentials/shared-grant-card";
import { SharedGrantCardSkeleton } from "@/components/credentials/shared-grant-card-skeleton";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { SearchField } from "@/components/ui/search-field";
import { Skeleton } from "@/components/ui/skeleton";
import { useFetchSharedGrants } from "@/lib/queries/credentials";

export const handle = { breadcrumb: "Shared" };

const CredentialDetails = lazy(() =>
  import("@/components/credentials/credential-details").then((m) => ({
    default: m.CredentialDetails,
  })),
);

type ActiveDialog = { type: "details"; credentialId: string } | null;

function searchableText(sg: SharedGrant): string {
  const notes = sg.credential?.publicNotes ?? {};
  return [sg.grant.ag_grantee_wallet_identifier, ...Object.values(notes).map(String)].join(" ");
}

function SharedGrantsList() {
  const { data: sharedGrants } = useFetchSharedGrants();
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get("q") ?? "";
  const deferredSearch = useDeferredValue(search);
  const [activeDialog, setActiveDialog] = useState<ActiveDialog>(null);
  const closeDialog = () => setActiveDialog(null);

  const results = useMemo(() => {
    if (!deferredSearch) return sharedGrants;
    return matchSorter(sharedGrants, deferredSearch, {
      keys: [searchableText],
      threshold: matchSorter.rankings.CONTAINS,
    });
  }, [deferredSearch, sharedGrants]);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
      <SearchField
        value={search}
        onChange={(e) => {
          const value = e.target.value;
          setSearchParams(value ? { q: value } : {}, { replace: true });
        }}
        onClear={() => setSearchParams({}, { replace: true })}
        placeholder="Search by recipient, credential type, issuer..."
      />
      <p className="text-muted-foreground text-sm">
        {results.length} {results.length === 1 ? "Grant" : "Grants"} found
      </p>
      {results.length > 0 ? (
        <ul id="shared-grants-list" className="flex flex-1 flex-col gap-5">
          {results.map((sharedGrant) => (
            <li key={sharedGrant.grant.id} className="list-none">
              <SharedGrantCard
                sharedGrant={sharedGrant}
                onViewDetails={(id) => setActiveDialog({ type: "details", credentialId: id })}
              />
            </li>
          ))}
        </ul>
      ) : (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon" className="size-12">
              {deferredSearch ? (
                <SearchSlashIcon className="size-6" />
              ) : (
                <SendIcon className="size-6" />
              )}
            </EmptyMedia>
            <EmptyTitle className="text-xl">
              {deferredSearch ? "No grants found" : "No shared credentials yet"}
            </EmptyTitle>
            <EmptyDescription>
              {deferredSearch
                ? "Try adjusting your search terms or clearing the filter."
                : "Credentials you share with others will appear here."}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
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
    </div>
  );
}

function SharedGrantsPending() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
      <SearchField
        value=""
        onChange={() => {}}
        onClear={() => {}}
        placeholder="Search by recipient, credential type, issuer..."
      />
      <Skeleton className="h-4 w-36 rounded" />
      {Array.from({ length: 3 }, (_, i) => (
        <SharedGrantCardSkeleton key={i} />
      ))}
    </div>
  );
}

export default function SharedWithOthers() {
  return (
    <div className="flex flex-1 flex-col items-stretch gap-5">
      <div className="bg-card flex h-14 items-center justify-between rounded-xl p-5 lg:h-20">
        <h1 className="block text-2xl font-bold lg:text-3xl">Shared with others</h1>
      </div>
      <Suspense fallback={<SharedGrantsPending />}>
        <SharedGrantsList />
      </Suspense>
    </div>
  );
}
