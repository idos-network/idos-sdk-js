import { ChakraProvider } from "@chakra-ui/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { BrowserProvider, Eip1193Provider } from "ethers";
import { MetaMaskProvider } from "metamask-react";
import React from "react";
import ReactDOM from "react-dom/client";
import { Navigate, RouterProvider, createBrowserRouter } from "react-router-dom";
import { theme } from "#/lib/theme";

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

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ChakraProvider theme={theme}>
      <QueryClientProvider client={queryClient}>
        <MetaMaskProvider>
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
        </MetaMaskProvider>
      </QueryClientProvider>
    </ChakraProvider>
  </React.StrictMode>
);
