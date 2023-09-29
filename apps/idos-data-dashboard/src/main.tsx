import { ChakraProvider, extendTheme } from "@chakra-ui/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Provider } from "jotai";
import { MetaMaskProvider } from "metamask-react";
import React from "react";
import ReactDOM from "react-dom/client";
import { I18nextProvider } from "react-i18next";
import { RouterProvider, createBrowserRouter } from "react-router-dom";

import i18n from "@/lib/i18n";
import { store } from "@/lib/store";

import App from "./app";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ethereum: any;
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 0,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
    },
  },
});

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <I18nextProvider i18n={i18n}>
      <ChakraProvider
        theme={extendTheme({
          config: {
            initialColorMode: "light",
            useSystemColorMode: false,
          },
        })}
      >
        <Provider store={store}>
          <MetaMaskProvider>
            <QueryClientProvider client={queryClient}>
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
                            lazy: () => import("@/routes/dashboard/attributes"),
                          },
                          {
                            path: "wallets",
                            lazy: () => import("@/routes/dashboard/wallets"),
                          },
                          {
                            path: "credentials",
                            lazy: () => import("@/routes/dashboard/credentials"),
                          },
                        ],
                      },
                    ],
                  },
                ])}
              />

              <ReactQueryDevtools />
            </QueryClientProvider>
          </MetaMaskProvider>
        </Provider>
      </ChakraProvider>
    </I18nextProvider>
  </React.StrictMode>
);
