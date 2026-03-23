import { SearchField } from "@/components/ui/search-field";
import { Skeleton } from "@/components/ui/skeleton";

import { CredentialCardSkeleton } from "./credential-card-skeleton";

export function CredentialsPending() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
      <SearchField value="" onChange={() => {}} onClear={() => {}} />
      <Skeleton className="h-4 w-36 rounded" />
      {Array.from({ length: 3 }, (_, i) => (
        <CredentialCardSkeleton key={i} />
      ))}
    </div>
  );
}
