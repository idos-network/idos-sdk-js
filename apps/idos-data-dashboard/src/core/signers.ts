import type { Wallet } from "@idos-network/kwil-infra";
import type { FaceSignSignerProvider } from "@idos-network/kwil-infra/facesign";
import type { WalletSelector } from "@near-wallet-selector/core";
import { getWalletClient } from "@wagmi/core";
import { wagmiConfig } from "./wagmi";

let faceSignProvider: FaceSignSignerProvider | null = null;

export function setFaceSignProvider(provider: FaceSignSignerProvider) {
  if (faceSignProvider && faceSignProvider !== provider) {
    faceSignProvider.destroy();
  }
  faceSignProvider = provider;
}

export function clearFaceSignProvider() {
  faceSignProvider?.destroy();
  faceSignProvider = null;
}

export async function createEvmSigner(): Promise<Wallet> {
  const { BrowserProvider } = await import("ethers");

  // If we are reconnecting, we need to use the new wallet client
  // we have to wait
  if (wagmiConfig.state.status === "reconnecting") {
    return new Promise((resolve, reject) => {
      const unsubscribe = wagmiConfig.subscribe(
        (state) => state,
        (state, _prevState) => {
          if (state.status === "connected") {
            unsubscribe();
            resolve(createEvmSigner());
          } else if (state.status === "disconnected") {
            unsubscribe();
            reject(new Error("EVM reconnection failed"));
          }
        },
      );
    });
  }

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
  const { default: stellarKit } = await import("./stellar-kit");
  return stellarKit;
}

export function createFaceSignSigner(): Wallet {
  if (!faceSignProvider) {
    throw new Error("FaceSign provider not initialized. Connect via FaceSign first.");
  }

  return faceSignProvider;
}
