import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { WagmiProvider } from "wagmi";

import { App } from "@/app";
import { ThemeProvider } from "@/components/ui";
import { IDOSProvider } from "@/idOS.provider";
import { getConfig } from "@/wagmi.config";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Root element not found");
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
      staleTime: Number.POSITIVE_INFINITY,
    },
  },
});

createRoot(root).render(
  <StrictMode>
    <WagmiProvider config={getConfig()}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <IDOSProvider>
            <App />
          </IDOSProvider>
        </ThemeProvider>
        <ReactQueryDevtools buttonPosition="bottom-left" />
      </QueryClientProvider>
    </WagmiProvider>
  </StrictMode>,
);
