import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "preact";
import { WagmiProvider } from "wagmi";

import { App } from "@/app.tsx";
import { config } from "@/wagmi.config";
import "@/index.css";

const root = document.getElementById("app");

if (!root) {
  throw new Error("Root element not found");
}

const queryClient = new QueryClient();

render(
  <WagmiProvider config={config}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </WagmiProvider>,
  root,
);
