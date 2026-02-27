import { mainnet, sepolia } from "@reown/appkit/networks";
import { createAppKit } from "@reown/appkit/react";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import {
  cookieStorage,
  createStorage,
  disconnect,
  type GetAccountReturnType,
  getAccount,
} from "@wagmi/core";

export const projectId = import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID;

if (!projectId) {
  throw new Error(
    "Missing VITE_WALLET_CONNECT_PROJECT_ID environment variable. " +
      "Get a project ID at https://cloud.reown.com/ and add it to your .env file.",
  );
}

const metadata = {
  name: "idOS Dashboard",
  description: "idOS Dashboard",
  url: import.meta.env.DEV ? "*" : "https://dashboard.idos.network",
  icons: ["/logo.svg"],
};

export const networks = [mainnet, sepolia] as [typeof mainnet, typeof sepolia];

export const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId,
  ssr: true,
  storage: createStorage({
    storage: cookieStorage,
  }),
});

export const wagmiConfig = wagmiAdapter.wagmiConfig;

export const appKit = createAppKit({
  adapters: [wagmiAdapter],
  networks,
  metadata,
  projectId,
  features: {
    analytics: true,
    email: false,
    socials: false,
  },
});

export function getEvmAccount(): GetAccountReturnType {
  return getAccount(wagmiConfig);
}

export function openEvmModal(): void {
  appKit.open();
}

export async function disconnectEvm(): Promise<void> {
  await disconnect(wagmiConfig);
}
