import { wagmiAdapter } from "@/app/providers";
import type { WalletInfo } from "@idos-network/core";
import type { CustomSigner } from "@idos-network/core";
import type { WalletSelector } from "@near-wallet-selector/core";
import { getEvmSigner } from "./evm";
import { getXrpSignature, signGemWalletTx } from "./xrp";

class KwilNonce {
  bytes: Uint8Array;

  constructor(length = 32) {
    // We're in the browser, so there's a window.crypto for sure.
    /* global crypto */
    this.bytes = crypto.getRandomValues(new Uint8Array(length));
  }

  get clampUTF8() {
    return this.bytes.map((byte) => byte & 127);
  }
}

const evmSigner = async () => await getEvmSigner(wagmiAdapter.wagmiConfig);
const xrpSigner = (): CustomSigner => async (message: Uint8Array<ArrayBufferLike>) => {
  const GemWallet = await import("@gemwallet/api");
  const isInstalled = await GemWallet.isInstalled();
  if (!isInstalled) {
    throw new Error("GemWallet is not installed");
  }
  const signature = await getXrpSignature(message, GemWallet);
  if (!signature) {
    throw new Error("Failed to sign transaction with XRP");
  }
  return Buffer.from(signature, "hex");
};

export const signNearMessage = async (
  nearSelector: WalletSelector,
  message: Uint8Array<ArrayBufferLike>,
): Promise<{ publicKey: string; signature: string }> => {
  debugger;
  const callbackUrl = window.location.href;
  const nonce = Buffer.from(new KwilNonce(32).clampUTF8);

  const signer = await nearSelector.wallet();
  const result = await signer.signMessage({
    message: Buffer.from(message).toString("utf8"),
    recipient: "idos.network",
    nonce,
    callbackUrl,
  });
  if (!result) {
    throw new Error("Failed to sign message with NEAR");
  }

  const { signature, publicKey } = result;
  return { publicKey, signature };
};

export const walletInfoMapper = ({
  address,
  publicKey,
  nearSelector,
  // @todo: use Record<WalletInfo[type] once u ready to implement all blockchains>
}: { address: string; publicKey: string; nearSelector: WalletSelector }): Record<
  "evm" | "xrpl" | "near",
  WalletInfo
> => ({
  evm: {
    address,
    publicKey,
    signer: evmSigner,
    type: "evm",
    signTx: async (message: string) => {
      const signer = await evmSigner();
      return await signer.signMessage(message);
    },
  },
  xrpl: {
    address,
    publicKey,
    type: "xrpl",
    signer: xrpSigner,
    signTx: async (message: string) => {
      const GemWallet = await import("@gemwallet/api");
      const signature = await signGemWalletTx(GemWallet, message);
      if (!signature) {
        throw new Error("Failed to sign transaction with XRP");
      }
      return signature;
    },
  },
  near: {
    address,
    publicKey,
    type: "near",
    signer: () => async (message: Uint8Array<ArrayBufferLike>) => {
      const wallet = nearSelector.wallet();
      return wallet;
      //   const signMessageOriginal = wallet.signMessage.bind(wallet);

      //   wallet.signMessage = async ({
      //     message,
      //     recipient,
      //   }: SignMessageParams): Promise<SignedMessage & { nonce?: Uint8Array }> => {
      //   console.log("=== NEAR SIGNER DEBUG ===");
      // console.log("Raw message bytes:", Array.from(message));
      // console.log("Raw message as string:", Buffer.from(message).toString("utf8"));
      // console.log("Raw message hex:", Buffer.from(message).toString("hex"));

      // // Generate nonce ONCE and use it for both signing and payload
      // const nonce = Buffer.from(new KwilNonce(32).clampUTF8); // Use clampUTF8 to match signNearMessage
      // console.log("Generated nonce:", Array.from(nonce));

      // const { signature } = await signNearMessage(nearSelector, message);
      // console.log("Signature from wallet:", signature);

      // // ADD THIS DEBUG CODE HERE:
      // console.log("What signNearMessage received:", {
      //   messageString: Buffer.from(message).toString("utf8"),
      //   messageBytes: Array.from(message),
      //   nonceBytes: Array.from(nonce)
      // });

      // const formatted = formatNearMessage(
      //   signature,
      //   Buffer.from(message).toString("utf8"),
      //   nonce, // Use the SAME nonce that was used for signing
      //   "idos.network",
      //   "https://idos.network",
      // );

      // console.log("Final formatted message hex:", Buffer.from(formatted).toString("hex"));
      // return formatted;
    },
    signTx: async (message: string) => {
      const { signature } = await signNearMessage(nearSelector, Buffer.from(message));
      return signature;
    },
  },
});
