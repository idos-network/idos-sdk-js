import { Skeleton } from "@/components/ui/skeleton";
import { WalletCardSkeleton } from "./wallet-card-skeleton";

export function WalletsPending() {
  return (
    <div className="flex flex-1 flex-col items-stretch gap-5">
      <div className="flex h-14 items-center justify-between rounded-xl bg-neutral-900 p-5 lg:h-20">
        <h1 className="block font-bold text-2xl lg:text-3xl">Wallets</h1>
        <Skeleton className="h-9 w-28 rounded-lg" />
      </div>
      <ul className="flex flex-1 flex-col gap-5">
        {Array.from({ length: 3 }, (_, i) => (
          <li key={i} className="list-none">
            <WalletCardSkeleton />
          </li>
        ))}
      </ul>
    </div>
  );
}
