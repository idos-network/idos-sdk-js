import { ChakraBaseProvider } from "@chakra-ui/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { createWeb3Modal } from "@web3modal/wagmi/react";
import React from "react";
import ReactDOM from "react-dom/client";
import { Navigate, Outlet, RouterProvider, createBrowserRouter } from "react-router-dom";
import { WagmiProvider } from "wagmi";

import App from "@/app";
import { Provider as IDOSProvider } from "@/core/idos";
import { WalletSelectorContextProvider } from "@/core/near";
import { projectId, wagmiConfig } from "@/core/wagmi";
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

createWeb3Modal({ wagmiConfig, projectId });

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ChakraBaseProvider theme={theme}>
      <WalletSelectorContextProvider>
        <WagmiProvider config={wagmiConfig}>
          <QueryClientProvider client={queryClient}>
            <IDOSProvider>
              <RouterProvider
                router={createBrowserRouter([
                  {
                    path: "/",
                    element: <App />,
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
                            path: "/success",
                            element: <Navigate to="/" />,
                          },

                          // temporary route setup for testing purposes of the SDK.
                          {
                            path: "/e2e",
                            element: <Outlet />,
                            children: [
                              {
                                path: "credential-filtering",
                                lazy: () => import("@/routes/dashboard/e2e/credential-filtering"),
                              },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                ])}
              />
            </IDOSProvider>
            <ReactQueryDevtools buttonPosition="bottom-left" />
          </QueryClientProvider>
        </WagmiProvider>
      </WalletSelectorContextProvider>
    </ChakraBaseProvider>
  </React.StrictMode>,
);
