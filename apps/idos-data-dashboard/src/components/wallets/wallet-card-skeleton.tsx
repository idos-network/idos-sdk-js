import { Skeleton } from "@/components/ui/skeleton";

export function WalletCardSkeleton() {
  return (
    <div className="flex items-center justify-between gap-5 rounded-xl bg-card p-5">
      <div className="flex items-center gap-5">
        <Skeleton className="size-12 rounded-full" />
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-4 w-16 rounded" />
          <Skeleton className="h-5 w-44 rounded" />
        </div>
      </div>
      <Skeleton className="h-9 w-24 rounded-lg" />
    </div>
  );
}
