import { mainnet, sepolia } from "@reown/appkit/networks";
import { createAppKit } from "@reown/appkit/react";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { disconnect, type GetAccountReturnType, getAccount } from "@wagmi/core";

export const projectId = import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID;

const metadata = {
  name: "idOS Dashboard",
  description: "idOS Dashboard",
  url: "https://dashboard.idos.network",
  icons: ["/dashboard-logo.svg"],
};

export const networks = [mainnet, sepolia] as [typeof mainnet, typeof sepolia];

export const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId,
});

export const wagmiConfig = wagmiAdapter.wagmiConfig;

const appKit = createAppKit({
  adapters: [wagmiAdapter],
  networks,
  metadata,
  projectId,
  features: {
    analytics: true,
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
