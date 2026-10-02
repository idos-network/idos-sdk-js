import type { WalletType } from "@idos-network/kwil-infra/actions";

export type AddWalletAttempt = {
  id: string;
  address: string;
  walletType: WalletType;
};

// A newer issuance replaces the in-flight attempt. Drop a committed chain message
// when the address or wallet type changed so a stale signature cannot be stored.
export function beginAddWalletAttempt(
  current: AddWalletAttempt | null,
  next: AddWalletAttempt,
): { attempt: AddWalletAttempt; dropChain: boolean } {
  return {
    attempt: next,
    dropChain:
      current !== null &&
      (current.address !== next.address || current.walletType !== next.walletType),
  };
}
