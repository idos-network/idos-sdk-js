import { ChakraBaseProvider } from "@chakra-ui/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { createWeb3Modal } from "@web3modal/wagmi/react";
import React from "react";
import ReactDOM from "react-dom/client";
import { Navigate, RouterProvider, createBrowserRouter } from "react-router-dom";
import { WagmiConfig } from "wagmi";

import App from "@/app";
import { CookieConsent } from "@/components/cookie-consent";
import { Provider as IDOSProvider } from "@/core/idos";
import { WalletSelectorContextProvider } from "@/core/near";
import { chains, projectId, wagmiConfig } from "@/core/wagmi";
import { theme } from "@/theme";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 0,
      refetchOnWindowFocus: false,
      staleTime: Infinity
    }
  }
});


createWeb3Modal({ wagmiConfig, projectId, chains });

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ChakraBaseProvider theme={theme}>
        <WalletSelectorContextProvider>
          {/* @todo: something is wrong with types when using tanstack/react-query and wagmi at the same time. Might be because of different versions. Needs investigation. */}
          {/* @ts-expect-error */}
          <WagmiConfig config={wagmiConfig}>
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
                              crumb: () => "Credentials"
                            }
                          },
                          {
                            path: "/wallets",
                            lazy: () => import("@/routes/dashboard/wallets"),
                            handle: {
                              crumb: () => "Wallets"
                            }
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
            </IDOSProvider>
          </WagmiConfig>
        </WalletSelectorContextProvider>
        <CookieConsent />
      </ChakraBaseProvider>
      <ReactQueryDevtools />
    </QueryClientProvider>
  </React.StrictMode>
);
