export const verifyRippleSignature = async (
  message: string,
  signature: string,
  publicKey: string,
): Promise<boolean> => {
  let xrpKeypair: typeof import("ripple-keypairs");

  try {
    xrpKeypair = await import("ripple-keypairs");
  } catch (_e) {
    throw new Error("Can't load ripple-keypairs");
  }

  const messageHex = Buffer.from(message).toString("hex");
  return xrpKeypair.verify(messageHex, signature, publicKey);
};
