import type * as GemWalletAPI from "@gemwallet/api";
import type * as GemWallet from "@gemwallet/api";
import { decode } from "xrpl";
import type { Xumm } from "xumm";
export type WalletType = "XAMAN" | "GEM";

export interface WalletConfig {
  type: WalletType;
  instance: Xumm | typeof GemWalletAPI;
}

export type XamanConfig = {
  type: "XAMAN";
  instance: Xumm;
};

export type GemConfig = {
  type: "GEM";
  instance: typeof GemWalletAPI;
};

export type WalletInitConfig = XamanConfig | GemConfig;

type XrpWallet = "Xumm" | "GemWallet";

export const createXummPayload = (message: string): Record<string, unknown> => {
  const memoData = Buffer.from(message).toString("hex"); // Encode message as hex for Memos
  return {
    custom_meta: {
      instruction: message,
    },
    txjson: {
      TransactionType: "SignIn",
      Memos: [
        {
          Memo: {
            MemoData: memoData,
            MemoType: Buffer.from("idOS").toString("hex"), // Optional type identifier
          },
        },
      ],
    },
  };
};
export const signXummTx = (
  xummInstance: Xumm,
  payload: Record<string, unknown>,
): Promise<string> => {
  return new Promise((resolve) => {
    // biome-ignore lint/suspicious/noExplicitAny: xumm payload type bit not easy to import
    xummInstance.payload?.createAndSubscribe(payload as unknown as any, async (event) => {
      if (!event.payload.response.hex) return;
      const hex = event.payload.response.hex;
      resolve(hex);
    });
  });
};

export const getXummPublicKey = async (wallet: Xumm): Promise<string | undefined> => {
  const payload = createXummPayload("Sign request from idOS");
  const txHash = await signXummTx(wallet, payload);
  const decodedTx = decode(txHash);
  return decodedTx.SigningPubKey as string;
};

export const signGemWalletTx = (
  gemWalletInstance: typeof GemWallet,
  message: string,
): Promise<string | undefined> => {
  return gemWalletInstance.signMessage(message).then((response) => response.result?.signedMessage);
};

export const getGemWalletPublicKey = async (
  wallet: typeof GemWallet,
): Promise<{ address: string; publicKey: string } | undefined> => {
  if ("isInstalled" in wallet) {
    await wallet.isInstalled();
    const { publicKey, address } = await wallet
      .getPublicKey()
      .then((res) => res.result as { publicKey: string; address: string });
    return { address, publicKey };
  }
};

export const getXrpAddress = async (
  wallet: Xumm | typeof GemWallet,
): Promise<string | undefined> => {
  if ("isInstalled" in wallet) {
    await wallet.isInstalled();
    return wallet.getAddress().then((response) => response.result?.address);
  }
  return wallet.user.account;
};

// Type guard to check if the wallet is an Xumm wallet
export function looksLikeXrpWallet(wallet: unknown): wallet is Xumm | typeof GemWallet {
  return (
    wallet !== null &&
    typeof wallet === "object" &&
    ("authorize" in wallet || "isInstalled" in wallet)
  );
}
export const getXrpWalletType = async (object: Record<string, unknown>): Promise<XrpWallet> => {
  if ("authorize" in object) {
    return "Xumm";
  }
  if ("isInstalled" in object) {
    return "GemWallet";
  }
  throw new Error("Unknown wallet type");
};

export const getXrpTxHash = async (
  message: string | Uint8Array,
  wallet: Xumm | typeof GemWallet,
): Promise<string | undefined> => {
  let messageString: string;

  const xrpWalletType = await getXrpWalletType(wallet as Record<string, unknown>);

  messageString = typeof message === "string" ? message : Buffer.from(message).toString("utf8"); // Decode Uint8Array to string
  if (xrpWalletType === "Xumm") {
    const memoData = Buffer.from(messageString).toString("hex"); // Encode message as hex for Memos

    const payload = {
      custom_meta: {
        instruction: messageString,
      },
      txjson: {
        TransactionType: "SignIn",
        Memos: [
          {
            Memo: {
              MemoData: memoData,
              MemoType: Buffer.from("idOS").toString("hex"), // Optional type identifier
            },
          },
        ],
      },
    };
    const xummTx = await signXummTx(wallet as Xumm, payload);
    console.log("xummTx", xummTx);
  } else if (xrpWalletType === "GemWallet") {
    const signature = await signGemWalletTx(wallet as typeof GemWallet, messageString);
    if (!signature) {
      throw new Error("Failed to sign transaction with GemWallet");
    }
    return signature;
  }
};

export const getXrpPublicKey = async (
  wallet: Xumm | typeof GemWallet,
): Promise<{ address: string; publicKey: string } | undefined> => {
  const xrpWalletType = await getXrpWalletType(wallet as Record<string, unknown>);
  if (xrpWalletType === "Xumm") {
    // @todo: should we remove xaman wallet support?
    const publicKey = await getXummPublicKey(wallet as Xumm);
    const address = await getXrpAddress(wallet);
    return { address: address as string, publicKey: publicKey as string };
  }
  return getGemWalletPublicKey(wallet as typeof GemWallet);
};
