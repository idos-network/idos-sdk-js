/* eslint-disable @typescript-eslint/no-explicit-any */
import i18n from "#/lib/i18n";
import { theme } from "#/lib/theme";
import { ChakraProvider } from "@chakra-ui/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { createWeb3Modal, defaultWagmiConfig } from "@web3modal/wagmi/react";

import React from "react";
import ReactDOM from "react-dom/client";
import { I18nextProvider } from "react-i18next";
import {
  Navigate,
  RouterProvider,
  createBrowserRouter
} from "react-router-dom";
import { WagmiConfig } from "wagmi";
import { goerli } from "wagmi/chains";

import App from "./app";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 0
    }
  }
});

const metadata = {
  name: "idOS Dashboard",
  url: "https://dashboard.idos.network"
};

const projectId = import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID;
const chains = [goerli];
const wagmiConfig = defaultWagmiConfig({
  chains,
  projectId,
  metadata
});

createWeb3Modal({ wagmiConfig, projectId, chains });

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <I18nextProvider i18n={i18n}>
      <WagmiConfig config={wagmiConfig as any}>
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
      </WagmiConfig>
    </I18nextProvider>
  </React.StrictMode>
);
