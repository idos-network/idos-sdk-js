import type { Wallet } from "@idos-network/kwil-infra";
import type { WalletSelector } from "@near-wallet-selector/core";
import { getWalletClient } from "@wagmi/core";
import stellarKit from "./stellar-kit";
import { wagmiConfig } from "./wagmi";

export async function createEvmSigner(): Promise<Wallet> {
  const { BrowserProvider } = await import("ethers");
  const walletClient = await getWalletClient(wagmiConfig);
  const provider = new BrowserProvider(walletClient.transport);
  return provider.getSigner();
}

export async function createNearSigner(selector: WalletSelector): Promise<Wallet> {
  const wallet = await selector.wallet();
  return wallet as unknown as Wallet;
}

export async function createXrplSigner(): Promise<Wallet> {
  const GemWallet = await import("@gemwallet/api");
  // @ts-expect-error GemWallet type mismatch between versions
  return GemWallet as Wallet;
}

export async function createStellarSigner(): Promise<Wallet> {
  return stellarKit;
}
