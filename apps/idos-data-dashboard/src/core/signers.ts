import * as GemWallet from "@gemwallet/api";
import {
  type CustomKwilSigner,
  KwilSigner,
  signNearMessage,
  type Wallet,
} from "@idos-network/kwil-infra";
import type { WalletType } from "@idos-network/kwil-infra/actions";
import { signGemWalletTx } from "@idos-network/kwil-infra/xrp-utils";
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

export interface WalletInfo {
  address: string;
  publicKey: string;
  type: WalletType;
  signMethod: (message: string) => Promise<string>;
  signer: () => Promise<Wallet>;
}

export const walletInfoMapper = ({
  address,
  publicKey,
  selector,
}: {
  address: string;
  publicKey: string;
  selector: WalletSelector;
}): { [key in WalletType]: WalletInfo } => ({
  EVM: {
    address,
    publicKey,
    signMethod: (message: string) => signMessage(wagmiConfig, { message: message }),
    type: "EVM",
    signer: async () => await getEvmSigner(wagmiConfig),
  },
  NEAR: {
    address,
    publicKey,
    signMethod: async (message: string) => {
      const signer = await selector.wallet();
      const signature = await signNearMessage(signer, message);
      return signature;
    },
    signer: () => selector.wallet() as Promise<Wallet>,
    type: "NEAR",
  },
  XRPL: {
    signMethod: async (message: string) => {
      const signature = await signGemWalletTx(GemWallet, message);
      return signature as string;
    },
    address,
    publicKey,
    type: "XRPL",
    // @ts-expect-error We need to fix the typing here
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
      ) as CustomKwilSigner;
      try {
        signer.publicAddress = address;
      } catch (error) {
        console.log("error setting public address", error);
      }
      return signer;
    },
  },
});
