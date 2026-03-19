import { Skeleton } from "@/components/ui/skeleton";

export function WalletCardSkeleton() {
  return (
    <div className="bg-card flex w-full flex-col gap-4 rounded-xl border p-5">
      <div className="flex items-center gap-3">
        <Skeleton className="size-12 shrink-0 rounded-lg" />
        <div className="flex flex-1 flex-col gap-1.5">
          <Skeleton className="h-5 w-40 rounded" />
          <Skeleton className="h-4 w-24 rounded" />
        </div>
      </div>
      <Skeleton className="h-8 w-44 rounded-lg" />
    </div>
  );
}
