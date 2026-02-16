import { Skeleton } from "@/components/ui/skeleton";
import { WalletCardSkeleton } from "./wallet-card-skeleton";

export function WalletsPending() {
  return (
    <div className="flex flex-col items-stretch gap-5 flex-1">
      <div className="flex items-center justify-between h-14 lg:h-20 p-5 bg-neutral-900 rounded-xl">
        <h1 className="block text-2xl lg:text-3xl font-bold">Wallets</h1>
        <Skeleton className="h-9 w-28 rounded-lg" />
      </div>
      <ul className="flex flex-col gap-5 flex-1">
        {Array.from({ length: 3 }, (_, i) => (
          <li key={i} className="list-none">
            <WalletCardSkeleton />
          </li>
        ))}
      </ul>
    </div>
  );
}
