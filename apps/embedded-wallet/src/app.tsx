import { useEffect } from "react";
import { EVMConnector } from "./components/evm";
import { NearConnector } from "./components/near";
import { StellarConnector } from "./components/stellar";
import { XRPLConnector } from "./components/xrp";
import { useWalletState } from "./state";

const getHiddenWalletTypes = () => {
  const params = new URLSearchParams(window.location.search);
  const hiddenWallets = params.get("skip_wallets") ?? "";
  return hiddenWallets ? hiddenWallets.split(",") : [];
};

const hiddenWalletType = getHiddenWalletTypes();

function WalletConnector() {
  const { connectedWalletType } = useWalletState();

  if (!connectedWalletType) {
    return (
      <>
        {!hiddenWalletType.includes("evm") && <EVMConnector />}
        {!hiddenWalletType.includes("near") && <NearConnector />}
        {!hiddenWalletType.includes("xrpl") && <XRPLConnector />}
        {!hiddenWalletType.includes("stellar") && <StellarConnector />}
      </>
    );
  }

  if (connectedWalletType === "evm") {
    return <EVMConnector />;
  }

  if (connectedWalletType === "near") {
    return <NearConnector />;
  }

  if (connectedWalletType === "xrpl") {
    return <XRPLConnector />;
  }

  if (connectedWalletType === "stellar") {
    return <StellarConnector />;
  }

  return null;
}

export function App() {
  const { walletPayload } = useWalletState();

  useEffect(() => {
    if (walletPayload) {
      if (!import.meta.env.VITE_DATA_DASHBOARD_URL) {
        console.warn("VITE_DATA_DASHBOARD_URL is not set");
        return;
      }
      if (!window.opener) {
        console.log("No opener window found");
        return;
      }

      walletPayload
        .disconnect()
        .then(() => {
          // Send wallet payload back to the parent window
          window.opener.postMessage(
            {
              type: "WALLET_SIGNATURE",
              // Remove disconnect method from walletPayload
              data: {
                ...walletPayload,
                disconnect: undefined,
              },
            },
            import.meta.env.VITE_DATA_DASHBOARD_URL,
          );

          // Close the popup window after sending the data
          window.close();
        })
        .catch((error: any) => {
          console.error("Error disconnecting wallet", error);
        });
    }
  }, [walletPayload]);

  return (
    <div className="grid h-full place-content-center">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col items-stretch justify-center gap-4">
          <WalletConnector />
        </div>
      </div>
    </div>
  );
}
