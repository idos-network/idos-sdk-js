export const verifyEvmSignature = async (
  message: string,
  signature: `0x${string}`,
  address: `0x${string}`,
): Promise<boolean> => {
  let wagmi: typeof import("@wagmi/core");

  try {
    wagmi = await import("@wagmi/core");
  } catch (_e) {
    throw new Error("Can't load @wagmi/core");
  }

  let chains: typeof import("@wagmi/core/chains");
  try {
    chains = await import("@wagmi/core/chains");
  } catch (_e) {
    throw new Error("Can't load @wagmi/core/chains");
  }

  const wagmiConfig = wagmi.createConfig({
    chains: [chains.mainnet],
    transports: {
      [chains.mainnet.id]: wagmi.http(),
    },
  });

  return wagmi.verifyMessage(wagmiConfig, {
    address,
    message,
    signature,
  });
};
