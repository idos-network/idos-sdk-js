import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./app.tsx";
import { AppKitProvider } from "./appkit.provider.tsx";
import { IDOSProvider } from "./idOS.provider.tsx";
import { NearWalletProvider } from "./near.provider.tsx";
import { StellarWalletProvider } from "./stellar.provider.tsx";
import { WalletConnectorProvider } from "./wallet-connector.provider.tsx";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Root element not found");
}

createRoot(root).render(
  <StrictMode>
    <ChakraProvider value={defaultSystem}>
      <AppKitProvider>
        <NearWalletProvider>
          <StellarWalletProvider>
            <WalletConnectorProvider>
              <IDOSProvider>
                <App />
              </IDOSProvider>
            </WalletConnectorProvider>
          </StellarWalletProvider>
        </NearWalletProvider>
      </AppKitProvider>
    </ChakraProvider>
  </StrictMode>,
);
