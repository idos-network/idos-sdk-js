import { Skeleton } from "@/components/ui/skeleton";

export function CredentialCardSkeleton() {
  return (
    <div className="flex flex-col gap-12 p-5 bg-neutral-900 rounded-xl">
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-5">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="flex flex-col gap-2">
            <Skeleton className="h-4 w-12 rounded" />
            <Skeleton className="h-5 w-24 rounded" />
          </div>
        ))}
      </div>
      <div className="flex flex-col lg:flex-row gap-4">
        <Skeleton className="h-9 w-28 rounded-lg" />
        <Skeleton className="h-9 w-36 rounded-lg" />
        <Skeleton className="h-9 w-24 rounded-lg" />
      </div>
    </div>
  );
}
