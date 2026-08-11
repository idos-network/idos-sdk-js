import type * as GemWalletApi from "@gemwallet/api";
import type { KwilSigner } from "@idos-network/kwil-infra";
import type { FaceSignSignerProvider } from "@idos-network/kwil-infra/facesign";
import type { Wallet as NearWallet, WalletSelector } from "@near-wallet-selector/core";
import type { JsonRpcSigner } from "ethers";

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

export async function createEvmSigner(): Promise<JsonRpcSigner> {
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

export async function createNearSigner(selector: WalletSelector): Promise<NearWallet> {
  return selector.wallet();
}

export async function createXrplSigner(): Promise<typeof GemWalletApi> {
  return import("@gemwallet/api");
}

export async function createStellarSigner(walletPublicKey: string): Promise<KwilSigner> {
  const { default: stellarKit } = await import("./stellar-kit");
  const { KwilSigner } = await import("@idos-network/kwil-infra");

  return new KwilSigner(
    async (msg: Uint8Array): Promise<Uint8Array> => {
      const messageBase64 = Buffer.from(msg).toString("base64");
      const result = await stellarKit.signMessage(messageBase64);

      let signedMessage = Buffer.from(result.signedMessage, "base64");

      if (signedMessage.length > 64) {
        signedMessage = Buffer.from(signedMessage.toString(), "base64");
      }
      return signedMessage;
    },
    walletPublicKey,
    "ed25519",
  );
}

export function createFaceSignSigner(): FaceSignSignerProvider {
  if (!faceSignProvider) {
    throw new Error("FaceSign provider not initialized. Connect via FaceSign first.");
  }

  return faceSignProvider;
}
