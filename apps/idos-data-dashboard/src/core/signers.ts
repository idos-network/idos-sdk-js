import type { Wallet } from "@idos-network/kwil-infra";
import { getWalletClient } from "@wagmi/core";
import { wagmiConfig } from "./wagmi";

export async function createEvmSigner(): Promise<Wallet> {
  const { BrowserProvider } = await import("ethers");
  const walletClient = await getWalletClient(wagmiConfig);
  const provider = new BrowserProvider(walletClient.transport);
  return provider.getSigner();
}

export async function createNearSigner(): Promise<Wallet> {
  const { getNearSelector } = await import("./near");
  const selector = getNearSelector();
  if (!selector) {
    throw new Error("NEAR selector not initialized");
  }
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
