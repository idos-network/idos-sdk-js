import { Wallet } from "../types";
import { getAccount, signMessage } from "@wagmi/core";

import { createAppKit } from "@reown/appkit";
import { mainnet } from "@reown/appkit/networks";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";

// 1. Get projectId at https://cloud.reown.com
const projectId = "5179b4c5b645907ab0677ba60b65ab67";

const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks: [mainnet],
})

// 2. Create your application's metadata object
const metadata = {
  name: "My Website",
  description: "My Website description",
  url: "https://mywebsite.com", // url must match your domain & subdomain
  icons: ["https://avatars.mywebsite.com/"],
};

// 3. Create a AppKit instance
const modal = createAppKit({
  adapters: [wagmiAdapter],
  metadata: metadata,
  networks: [mainnet],
  debug: true,
  projectId,
  features: {
    socials: [],
    email: false,
    analytics: true, // Optional - defaults to your Cloud configuration
  },
  themeVariables: { "--w3m-z-index": 200000 },
  includeWalletIds: [
    "c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96", // MetaMask
    "4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0", // TrustWallet
    "ecc4036f814562b41a5268adc86270fba1365471402006302e70169465b7ac18", // Zerion
    "d01c7758d741b363e637a817a09bcf579feae4db9f5bb16f599fdd1f66e2f974", // Valora
    "e6d7b916732325821a4016c374dec9e2d58becdac154ce3ea20db1fd9fe1d57e", // Zeal
  ],
});

export default class WalletConnect extends Wallet {
  static async init(): Promise<WalletConnect[]> {

    // biome-ignore lint/suspicious/noAsyncPromiseExecutor: <explanation>
    return new Promise(async (resolve, reject) => {
      // @ts-expect-error Not fully typed
      await modal.connectionControllerClient?.disconnect?.();

      modal.open();

      function handler(data: unknown) {
        if (!data) return;
    
        // Something was choosed
        const account = getAccount(wagmiAdapter.wagmiConfig);
    
        if (!account) reject(new Error("No account found"));
    
        resolve([
          new WalletConnect("eth", "walletconnect", account.address as string, account.address as string, 1, async (message: string) => {
            return signMessage(wagmiAdapter.wagmiConfig, { message, account: account.address });
          }),
        ]);
      }
      
      modal.subscribeWalletInfo(handler);
    });
  }
}
