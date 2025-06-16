import { Wallet } from "../types";

declare global {
  interface Window {
    ethereum: {
      request: <T extends { method: "eth_requestAccounts" | "personal_sign" }>(
        args: T,
      ) => Promise<T extends { method: "eth_requestAccounts" } ? string[] : string>;
    };
  }
}

export default class MetaMask extends Wallet {
  static isAvailable(): boolean {
    return typeof window !== "undefined" && "ethereum" in window;
  }

  static async init(): Promise<MetaMask[]> {
    const addresses = await window.ethereum.request({ method: "eth_requestAccounts" });

    return addresses.map(
      (address) =>
        new MetaMask("eth", "metamask", address, address, 1, async (message: string) => {
          return window.ethereum.request({ method: "personal_sign", params: [message, address] });
        }),
    );
  }
}
