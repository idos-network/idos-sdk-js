import { Skeleton } from "@/components/ui/skeleton";

export function SharedGrantCardSkeleton() {
  return (
    <div className="bg-card flex w-full flex-col gap-4 rounded-xl border p-5">
      <div className="flex items-center gap-3">
        <Skeleton className="size-12 shrink-0 rounded-lg" />
        <div className="flex flex-1 flex-col gap-1.5">
          <Skeleton className="h-5 w-32 rounded" />
          <Skeleton className="h-4 w-24 rounded" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>
      </div>
      <div className="flex flex-col rounded-lg">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="flex items-center justify-between px-3 py-2">
            <Skeleton className="h-4 w-20 rounded" />
            <Skeleton className="h-4 w-36 rounded" />
          </div>
        ))}
      </div>
      <div className="flex items-center justify-end gap-2">
        <Skeleton className="h-8 w-24 rounded-lg" />
        <Skeleton className="h-8 w-20 rounded-lg" />
      </div>
    </div>
  );
}
