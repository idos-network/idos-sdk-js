import { LIT_RPC } from "@lit-protocol/constants";
import { ethers } from "ethers";

export const LitChronicleChainParams = {
  chainId: ethers.utils.hexValue(175188), // Replace with Chronicle Yellowstone chainId in hex
  chainName: "Chronicle Yellowstone",
  nativeCurrency: {
    name: "tstLPX",
    symbol: "tstLPX",
    decimals: 18,
  },
  rpcUrls: [LIT_RPC.CHRONICLE_YELLOWSTONE],
};

const CHAINS = [LitChronicleChainParams];

async function addNetwork(chainParams: typeof LitChronicleChainParams) {
  try {
    await window.ethereum.request({
      method: "wallet_addEthereumChain",
      params: [chainParams],
    });
    console.log("Network added successfully");
  } catch (error) {
    console.error("Failed to add network:", error);
  }
}

export async function switchNetwork(chainId: string) {
  try {
    // Request to switch to the specified chainId
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: ethers.utils.hexValue(chainId) }], // Chain ID must be in hex format
    });
    console.log("Network switched successfully");
  } catch (error) {
    // If the user doesn't have the network added, you can catch the error and prompt them to add it
    if ((error as { code: number }).code === 4902) {
      console.log("Network not available in MetaMask, asking user to add it.");
      const chainInfo = CHAINS.find((chain) => chain.chainId === ethers.utils.hexValue(chainId));
      if (!chainInfo) throw new Error("chain is node added info supported chains array");
      await addNetwork(chainInfo);
    } else {
      console.error("Failed to switch network:", error);
    }
  }
}
