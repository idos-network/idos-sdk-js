import { effect } from "@preact/signals";
import { EVMConnector } from "./components/evm";
import { NearConnector } from "./components/near";
import { StellarConnector } from "./components/stellar";
import { XRPLConnector } from "./components/xrp";
import { connectedWalletType, walletPayload } from "./state";

function WalletConnector() {
  if (!connectedWalletType.value) {
    return (
      <>
        <EVMConnector />
        <NearConnector />
        <XRPLConnector />
        <StellarConnector />
      </>
    );
  }

  if (connectedWalletType.value === "evm") {
    return <EVMConnector />;
  }

  if (connectedWalletType.value === "near") {
    return <NearConnector />;
  }

  if (connectedWalletType.value === "xrpl") {
    return <XRPLConnector />;
  }

  if (connectedWalletType.value === "stellar") {
    return <StellarConnector />;
  }

  return null;
}

export function App() {
  effect(() => {
    if (walletPayload.value) {
      if (!import.meta.env.VITE_DATA_DASHBOARD_URL) {
        console.warn("VITE_DATA_DASHBOARD_URL is not set");
        return;
      }
      if (!window.opener) {
        console.log("No opener window found");
        return;
      }
      walletPayload.value
        .disconnect()
        .then(() => {
          // Send wallet payload back to the parent window
          window.opener.postMessage(
            {
              type: "WALLET_SIGNATURE",
              // Remove disconnect method from walletPayload
              data: {
                ...walletPayload.value,
                disconnect: undefined,
              },
            },
            import.meta.env.VITE_DATA_DASHBOARD_URL,
          );

          // Close the popup window after sending the data
          window.close();
        })
        .catch((error) => {
          console.error("Error disconnecting wallet", error);
        });
    }
  });

  return (
    <div class="grid h-full place-content-center">
      <div class="flex flex-col gap-4">
        <div class="flex flex-col items-stretch justify-center gap-4">
          <WalletConnector />
        </div>
      </div>
    </div>
  );
}
