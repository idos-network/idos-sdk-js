"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createWeb3Modal } from "@web3modal/wagmi/react";
import { defaultWagmiConfig } from "@web3modal/wagmi/react/config";

import { type Chain, sepolia } from "viem/chains";
import { WagmiProvider } from "wagmi";

// 1. Get projectId at https://cloud.walletconnect.com
// biome-ignore lint: style/noNonNullAssertion
const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_ID!;

// 2. Create wagmiConfig
const metadata = {
  name: "SumSub & idOS",
  description: "Test integration",
  url: "https://web3modal.com",
  icons: ["https://avatars.githubusercontent.com/u/37784886"],
};

const chains = [sepolia] as [Chain, ...Chain[]];

const wagmiConfig = defaultWagmiConfig({
  // @ts-expect-error viem is old
  chains,
  projectId,
  metadata,
  auth: {
    email: false,
    showWallets: true,
    walletFeatures: true,
    socials: [],
  },
});

// 3. Create modal
createWeb3Modal({
  // @ts-expect-error viem is old
  wagmiConfig,
  projectId,
  // @ts-expect-error viem is old
  defaultChain: sepolia,
  enableAnalytics: false, // Optional - defaults to your Cloud configuration
  includeWalletIds: [
    "c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96", // MetaMask
    "4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0", // TrustWallet
    "ecc4036f814562b41a5268adc86270fba1365471402006302e70169465b7ac18", // Zerion
  ],
});

const queryClient = new QueryClient();

export function Web3Modal({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* biome-ignore lint: suspicious/noExplicitAny */}
      <WagmiProvider config={wagmiConfig as any}>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </WagmiProvider>
    </>
  );
}
