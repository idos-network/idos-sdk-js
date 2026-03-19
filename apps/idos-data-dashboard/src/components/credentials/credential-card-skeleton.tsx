import { Skeleton } from "@/components/ui/skeleton";

export function CredentialCardSkeleton() {
  return (
    <div className="bg-card flex w-full flex-col gap-4 rounded-xl border p-5">
      <div className="flex items-center gap-3">
        <Skeleton className="size-12 shrink-0 rounded-lg" />
        <div className="flex flex-1 flex-col gap-1.5">
          <Skeleton className="h-5 w-32 rounded" />
          <Skeleton className="h-4 w-24 rounded" />
        </div>
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <div className="flex flex-col gap-2 rounded-lg">
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="h-8 w-24 rounded-lg" />
        <Skeleton className="h-8 w-28 rounded-lg" />
        <Skeleton className="ml-auto h-8 w-8 rounded-lg" />
      </div>
    </div>
  );
}
