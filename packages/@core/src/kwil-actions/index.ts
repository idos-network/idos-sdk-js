import type { KwilActionClient } from "../kwil-infra";
import { type AddWalletInput, addWallet, removeWallet } from "./actions";

export * from "./actions";

export async function addWallets(
  kwillClient: KwilActionClient,
  wallets: AddWalletInput[],
): Promise<void> {
  await Promise.all(wallets.map((wallet) => addWallet(kwillClient, wallet)));
}

export async function removeWallets(kwillClient: KwilActionClient, ids: string[]): Promise<void> {
  await Promise.all(ids.map((id) => removeWallet(kwillClient, { id })));
}
