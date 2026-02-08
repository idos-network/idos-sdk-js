export const verifyRippleSignature = async (
  message: string,
  signature: string,
  publicKey: string,
): Promise<boolean> => {
  let xrpKeypair: typeof import("ripple-keypairs");

  try {
    xrpKeypair = await import("ripple-keypairs");
  } catch (e) {
    throw new Error("Can't load ripple-keypairs", { cause: e });
  }

  const messageHex = Buffer.from(message).toString("hex");
  return xrpKeypair.verify(messageHex, signature, publicKey);
};
