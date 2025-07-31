import { ChakraBaseProvider } from "@chakra-ui/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { createWeb3Modal } from "@web3modal/wagmi/react";
import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";
import { WagmiProvider } from "wagmi";

import App from "@/app";
import { WalletSelectorContextProvider } from "@/core/near";
import { projectId, wagmiConfig } from "@/core/wagmi";
import { IDOSClientProvider } from "@/idOS.provider";
import { theme } from "@/theme";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 0,
      refetchOnWindowFocus: false,
      staleTime: Number.POSITIVE_INFINITY,
    },
  },
});

createWeb3Modal({ wagmiConfig, projectId: projectId });

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ChakraBaseProvider theme={theme}>
      <WalletSelectorContextProvider>
        {/* @ts-ignore: TODO: fix wagmi types */}
        <WagmiProvider config={wagmiConfig}>
          <QueryClientProvider client={queryClient}>
            <RouterProvider
              router={createBrowserRouter([
                {
                  path: "/",
                  element: (
                    <IDOSClientProvider>
                      <App />
                    </IDOSClientProvider>
                  ),
                  children: [
                    {
                      lazy: () => import("@/routes/dashboard"),
                      children: [
                        {
                          index: true,
                          lazy: () => import("@/routes/dashboard/credentials"),
                          handle: {
                            crumb: () => "Credentials",
                          },
                        },
                        {
                          path: "/wallets",
                          lazy: () => import("@/routes/dashboard/wallets"),
                          handle: {
                            crumb: () => "Wallets",
                          },
                        },
                        {
                          path: "/settings",
                          lazy: () => import("@/routes/dashboard/settings"),
                          handle: {
                            crumb: () => "Settings",
                          },
                        },
                        {
                          path: "/success",
                          element: <Navigate to="/" />,
                        },
                      ],
                    },
                  ],
                },
              ])}
            />
            <ReactQueryDevtools buttonPosition="bottom-left" />
          </QueryClientProvider>
        </WagmiProvider>
      </WalletSelectorContextProvider>
    </ChakraBaseProvider>
  </React.StrictMode>,
);
