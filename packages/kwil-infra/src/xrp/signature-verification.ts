import { hexEncode, utf8Encode } from "@idos-network/utils/codecs";

export const verifyRippleSignature = async (
  message: string,
  signature: string,
  publicKey: string,
): Promise<boolean> => {
  let xrpKeypair: typeof import("ripple-keypairs");

  try {
    xrpKeypair = await import("ripple-keypairs");
  } catch (e) {
    throw new Error("Can't load `ripple-keypairs`", { cause: e });
  }

  const messageHex = hexEncode(utf8Encode(message));
  return xrpKeypair.verify(messageHex, signature, publicKey);
};
