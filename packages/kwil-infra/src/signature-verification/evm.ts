export const verifyEvmSignature = async (
  message: string,
  signature: `0x${string}`,
  address: `0x${string}`,
): Promise<boolean> => {
  let verifyMessage: typeof import("viem").verifyMessage;

  try {
    verifyMessage = (await import("viem")).verifyMessage;
  } catch (_e) {
    throw new Error("Can't load viem");
  }

  try {
    return await verifyMessage({
      address,
      message,
      signature,
    });
  } catch (e) {
    console.warn("EVM signature verification failed:", e);
    return false;
  }
};
