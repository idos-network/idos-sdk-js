import type * as GemWallet from "@gemwallet/api";

export const signGemWalletTx = async (
  gemWalletInstance: typeof GemWallet,
  message: string,
): Promise<string | undefined> => {
  const sig = await gemWalletInstance
    .signMessage(message)
    .then((response) => response.result?.signedMessage);
  return sig;
};

export const getXrpSignature = async (
  message: string | Uint8Array,
  wallet: typeof GemWallet,
): Promise<string | undefined> => {
  const messageString =
    typeof message === "string" ? message : Buffer.from(message).toString("utf8");
  const signature = await signGemWalletTx(wallet, messageString);
  if (!signature) {
    throw new Error("Failed to sign transaction with GemWallet");
  }
  return signature;
};
