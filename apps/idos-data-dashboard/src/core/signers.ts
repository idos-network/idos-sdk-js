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

export async function createStellarSigner(
  walletPublicKey: string,
  walletAddress: string,
): Promise<Wallet> {
  const { default: stellarKit } = await import("./stellar-kit");
  const { KwilSigner } = await import("@idos-network/kwil-infra");

  const stellarSigner = new KwilSigner(
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
  // @ts-expect-error KwilSigner doesn't have publicAddress in its type definition
  stellarSigner.publicAddress = walletAddress;
  return stellarSigner as unknown as Wallet;
}

export function createFaceSignSigner(): Wallet {
  if (!faceSignProvider) {
    throw new Error("FaceSign provider not initialized. Connect via FaceSign first.");
  }

  return faceSignProvider as unknown as Wallet;
}
