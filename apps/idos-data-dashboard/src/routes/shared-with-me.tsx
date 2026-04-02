import type { idOSGrant } from "@idos-network/kwil-infra/actions";

import { InboxIcon, SearchSlashIcon } from "lucide-react";
import { matchSorter } from "match-sorter";
import { lazy, Suspense, useDeferredValue, useMemo, useState } from "react";
import { useSearchParams } from "react-router";

import { ReceivedGrantCard } from "@/components/credentials/received-grant-card";
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
import { useFetchReceivedGrants } from "@/lib/queries/credentials";

export const handle = { breadcrumb: "Received" };

const SharedCredentialDetails = lazy(() =>
  import("@/components/credentials/shared-credential-details").then((m) => ({
    default: m.SharedCredentialDetails,
  })),
);

type ActiveDialog = { type: "details"; credentialId: string } | null;

function searchableText(grant: idOSGrant): string {
  return [grant.id, grant.data_id, grant.ag_owner_user_id, grant.ag_grantee_wallet_identifier].join(
    " ",
  );
}

function ReceivedGrantsList() {
  const { data: grants } = useFetchReceivedGrants();
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get("q") ?? "";
  const deferredSearch = useDeferredValue(search);
  const [activeDialog, setActiveDialog] = useState<ActiveDialog>(null);
  const closeDialog = () => setActiveDialog(null);

  const results = useMemo(() => {
    if (!deferredSearch) return grants;
    return matchSorter(grants, deferredSearch, {
      keys: [searchableText],
      threshold: matchSorter.rankings.CONTAINS,
    });
  }, [deferredSearch, grants]);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
      <SearchField
        value={search}
        onChange={(e) => {
          const value = e.target.value;
          setSearchParams(value ? { q: value } : {}, { replace: true });
        }}
        onClear={() => setSearchParams({}, { replace: true })}
        placeholder="Search by grant ID, owner, data ID..."
      />
      <p className="text-muted-foreground text-sm">
        {results.length} {results.length === 1 ? "Grant" : "Grants"} found
      </p>
      {results.length > 0 ? (
        <ul id="received-grants-list" className="flex flex-1 flex-col gap-5">
          {results.map((grant) => (
            <li key={grant.id} className="list-none">
              <ReceivedGrantCard
                grant={grant}
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
                <InboxIcon className="size-6" />
              )}
            </EmptyMedia>
            <EmptyTitle className="text-xl">
              {deferredSearch ? "No grants found" : "No grants shared with you yet"}
            </EmptyTitle>
            <EmptyDescription>
              {deferredSearch
                ? "Try adjusting your search terms or clearing the filter."
                : "Grants shared with you by others will appear here."}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
      {activeDialog?.type === "details" && (
        <Suspense>
          <SharedCredentialDetails
            credentialId={activeDialog.credentialId}
            isOpen
            onClose={closeDialog}
          />
        </Suspense>
      )}
    </div>
  );
}

function ReceivedGrantsPending() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
      <SearchField
        value=""
        onChange={() => {}}
        onClear={() => {}}
        placeholder="Search by grant ID, owner, data ID..."
      />
      <Skeleton className="h-4 w-36 rounded" />
      {Array.from({ length: 3 }, (_, i) => (
        <SharedGrantCardSkeleton key={i} />
      ))}
    </div>
  );
}

export default function SharedWithMe() {
  return (
    <div className="flex flex-1 flex-col items-stretch gap-5">
      <div className="bg-card flex h-14 items-center justify-between rounded-xl p-5 lg:h-20">
        <h1 className="block text-2xl font-bold lg:text-3xl">Shared with me</h1>
      </div>
      <Suspense fallback={<ReceivedGrantsPending />}>
        <ReceivedGrantsList />
      </Suspense>
    </div>
  );
}
