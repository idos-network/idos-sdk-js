import * as GemWallet from "@gemwallet/api";
import type { Wallet } from "@idos-network/kwil-infra";
import { KwilSigner } from "@idos-network/kwil-infra";
import type { WalletSelector } from "@near-wallet-selector/core";
import { getWalletClient } from "@wagmi/core";
import { BrowserProvider } from "ethers";
import stellarKit from "./stellar-kit";
import { wagmiConfig } from "./wagmi";

export async function createEvmSigner(): Promise<Wallet> {
  const walletClient = await getWalletClient(wagmiConfig);
  const provider = new BrowserProvider(walletClient.transport);
  return provider.getSigner();
}

export async function createNearSigner(selector: WalletSelector): Promise<Wallet> {
  const wallet = await selector.wallet();
  return wallet as unknown as Wallet;
}

export async function createXrplSigner(): Promise<Wallet> {
  // @ts-expect-error GemWallet type mismatch between versions
  return GemWallet as Wallet;
}

export async function createStellarSigner(
  walletPublicKey: string,
  walletAddress: string,
): Promise<Wallet> {
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
