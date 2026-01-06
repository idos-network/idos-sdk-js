import * as GemWallet from "@gemwallet/api";
import type { WalletInfo } from "@idos-network/controllers";
import { KwilSigner, signGemWalletTx, signNearMessage } from "@idos-network/core";
import type { WalletSelector } from "@near-wallet-selector/core";
import { type Config, getWalletClient, signMessage } from "@wagmi/core";
import { BrowserProvider } from "ethers";
import stellarKit from "./stellar-kit";
import { wagmiConfig } from "./wagmi";

const getEvmSigner = async (wagmiConfig: Config) => {
  const walletClient = await getWalletClient(wagmiConfig);
  const provider = walletClient && new BrowserProvider(walletClient.transport);
  const signer = provider && (await provider.getSigner());
  return signer;
};

export const walletInfoMapper = ({
  address,
  publicKey,
  selector,
}: {
  address: string;
  publicKey: string;
  selector: WalletSelector;
}): Record<"evm" | "near" | "xrpl" | "Stellar", WalletInfo> => ({
  evm: {
    address,
    publicKey,
    signMethod: (message: string) => signMessage(wagmiConfig, { message: message }),
    type: "evm",
    signer: async () => await getEvmSigner(wagmiConfig),
  },
  near: {
    address,
    publicKey,
    signMethod: async (message: string) => {
      const signer = await selector.wallet();
      const signature = await signNearMessage(signer, message);
      return signature;
    },
    signer: () => selector.wallet() as unknown as any,
    type: "near",
  },
  xrpl: {
    signMethod: async (message: string) => {
      const signature = await signGemWalletTx(GemWallet, message);
      return signature as string;
    },
    address,
    publicKey,
    type: "xrpl",
    signer: async () => GemWallet,
  },
  Stellar: {
    address,
    publicKey,
    signMethod: async (message: string) => {
      // Encode the message as base64 (stellarKit expects this)
      const messageBase64 = Buffer.from(message).toString("base64");

      const result = await stellarKit.signMessage(messageBase64);

      // Double-decode the signature
      let signedMessage = Buffer.from(result.signedMessage, "base64");

      if (signedMessage.length > 64) {
        signedMessage = Buffer.from(signedMessage.toString(), "base64");
      }

      // Convert to hex string for the database
      const signatureHex = signedMessage.toString("hex");

      return signatureHex;
    },
    type: "Stellar",
    signer: async () => {
      const signer = new KwilSigner(
        async (msg: Uint8Array): Promise<Uint8Array> => {
          const messageBase64 = Buffer.from(msg).toString("base64");
          const result = await stellarKit.signMessage(messageBase64);

          let signedMessage = Buffer.from(result.signedMessage, "base64");

          if (signedMessage.length > 64) {
            signedMessage = Buffer.from(signedMessage.toString(), "base64");
          }
          return signedMessage;
        },
        publicKey,
        "ed25519",
      );
      try {
        // @ts-expect-error
        signer.publicAddress = address;
      } catch (error) {
        console.log("error setting public address", error);
      }
      return signer;
    },
  },
});
