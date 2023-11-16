import idOSDashboardLogo from "#/assets/idos-dashboard-logo.svg";
import i18n from "#/lib/i18n";
import { theme } from "#/lib/theme";
import { ChakraProvider } from "@chakra-ui/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ConnectKitProvider, getDefaultConfig } from "connectkit";
import { BrowserProvider, Eip1193Provider } from "ethers";
import React from "react";
import ReactDOM from "react-dom/client";
import { I18nextProvider } from "react-i18next";
import { WagmiConfig, createConfig } from "wagmi";

import {
  Navigate,
  RouterProvider,
  createBrowserRouter
} from "react-router-dom";

import { goerli } from "wagmi/chains";
import App from "./app";

declare global {
  interface Window {
    ethereum: BrowserProvider & Eip1193Provider;
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 0
    }
  }
});

const config = createConfig(
  getDefaultConfig({
    walletConnectProjectId: import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID,
    appName: "idOS Dashboard",
    chains: [goerli],
    appDescription: "Your App Description",
    appUrl: "https://dashboard.idos.network",
    appIcon: idOSDashboardLogo
  })
);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <I18nextProvider i18n={i18n}>
      <WagmiConfig config={config}>
        <ConnectKitProvider>
          <ChakraProvider theme={theme}>
            <QueryClientProvider client={queryClient}>
              <RouterProvider
                router={createBrowserRouter([
                  {
                    path: "/",
                    element: <App />,
                    children: [
                      {
                        lazy: () => import("#/routes/dashboard"),
                        children: [
                          {
                            index: true,
                            lazy: () => import("#/routes/dashboard/credentials")
                          },
                          {
                            path: "/wallets",
                            lazy: () => import("#/routes/dashboard/wallets")
                          },
                          {
                            path: "/success",
                            element: <Navigate to="/" />
                          }
                        ]
                      }
                    ]
                  }
                ])}
              />
              <ReactQueryDevtools />
            </QueryClientProvider>
          </ChakraProvider>
        </ConnectKitProvider>
      </WagmiConfig>
    </I18nextProvider>
  </React.StrictMode>
);
