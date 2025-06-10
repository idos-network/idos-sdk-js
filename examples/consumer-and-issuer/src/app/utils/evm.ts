import { type Config, getWalletClient } from "@wagmi/core";
import { BrowserProvider } from "ethers";

export const getEvmSigner = async (wagmiConfig: Config) => {
  const walletClient = await getWalletClient(wagmiConfig);
  const provider = walletClient && new BrowserProvider(walletClient.transport);
  return await provider.getSigner();
};
