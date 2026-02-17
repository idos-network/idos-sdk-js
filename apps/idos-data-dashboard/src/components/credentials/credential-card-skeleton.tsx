import { Skeleton } from "@/components/ui/skeleton";

export function CredentialCardSkeleton() {
  return (
    <div className="flex flex-col gap-12 rounded-xl bg-neutral-900 p-5">
      <div className="grid grid-cols-2 gap-5 lg:grid-cols-6">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="flex flex-col gap-2">
            <Skeleton className="h-4 w-12 rounded" />
            <Skeleton className="h-5 w-24 rounded" />
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-4 lg:flex-row">
        <Skeleton className="h-9 w-28 rounded-lg" />
        <Skeleton className="h-9 w-36 rounded-lg" />
        <Skeleton className="h-9 w-24 rounded-lg" />
      </div>
    </div>
  );
}
