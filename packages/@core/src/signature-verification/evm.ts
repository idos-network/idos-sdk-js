import { http, createConfig, verifyMessage } from "@wagmi/core";
import { mainnet } from "@wagmi/core/chains";

const wagmiConfig = createConfig({
  chains: [mainnet],
  transports: {
    [mainnet.id]: http(),
  },
});

export const verifyEvmSignature = async (
  message: string,
  signature: `0x${string}`,
  address: `0x${string}`,
): Promise<boolean> => {
  return verifyMessage(wagmiConfig, {
    address,
    message,
    signature,
  });
};
