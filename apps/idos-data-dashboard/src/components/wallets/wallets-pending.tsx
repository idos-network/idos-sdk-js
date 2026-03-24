import { WalletCardSkeleton } from "./wallet-card-skeleton";

export function WalletsPending() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
      {Array.from({ length: 3 }, (_, i) => (
        <WalletCardSkeleton key={i} />
      ))}
    </div>
  );
}
