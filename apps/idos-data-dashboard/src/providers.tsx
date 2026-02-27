import { QueryClientProvider } from "@tanstack/react-query";
import { type State, WagmiProvider } from "wagmi";
import { wagmiAdapter } from "./core/wagmi";
import { MachineProvider } from "./machines/provider";
import { queryClient } from "./query-client";

export default function Providers({
  children,
  initialState,
}: {
  children: React.ReactNode;
  initialState?: State;
}) {
  console.log("initialState", initialState);
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig} initialState={initialState}>
      <QueryClientProvider client={queryClient}>
        <MachineProvider>{children}</MachineProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
