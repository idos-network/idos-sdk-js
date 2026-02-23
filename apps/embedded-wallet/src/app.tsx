import type { WalletType } from "@idos-network/kwil-infra/actions";
import { useEffect } from "react";
import { EVMConnector } from "./components/evm";
import { FaceSignConnector } from "./components/facesign";
import { NearConnector } from "./components/near";
import { StellarConnector } from "./components/stellar";
import { XRPLConnector } from "./components/xrp";
import { useWalletState } from "./state";

const getHiddenWalletTypes = (): string[] => {
  const params = new URLSearchParams(window.location.search);
  const hiddenWallets = params.get("skip_wallets") ?? "";
  return hiddenWallets ? hiddenWallets.split(",") : [];
};

const hiddenWalletType = getHiddenWalletTypes();

function WalletConnector() {
  const { connectedWalletType } = useWalletState();

  const showWallet = (walletType: WalletType) => {
    if (hiddenWalletType.includes(walletType.toLowerCase())) {
      return false;
    }

    if (connectedWalletType && connectedWalletType !== walletType) {
      return false;
    }

    return true;
  };

  return (
    <>
      {showWallet("FaceSign") && <FaceSignConnector />}
      {showWallet("EVM") && <EVMConnector />}
      {showWallet("NEAR") && <NearConnector />}
      {showWallet("XRPL") && <XRPLConnector />}
      {showWallet("Stellar") && <StellarConnector />}
    </>
  );
}

export function App() {
  const { walletPayload, connectedWalletType } = useWalletState();

  useEffect(() => {
    if (walletPayload && connectedWalletType) {
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
                // TODO: Use WalletSignature from utils later
                wallet_type: connectedWalletType,
                disconnect: undefined,
              },
            },
            import.meta.env.VITE_DATA_DASHBOARD_URL,
          );

          // Close the popup window after sending the data
          window.close();
        })
        .catch((error: unknown) => {
          console.error("Error disconnecting wallet", error);
        });
    }
  }, [walletPayload, connectedWalletType]);

  return (
    <div className="grid h-full place-content-center p-5">
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <img alt="idOS" src="/logo.svg" width={136} height={44} />
          <span className="font-bold text-lg text-neutral-50">Wallet Connector</span>
        </div>
        <div className="flex min-w-80 flex-col items-stretch justify-center gap-4">
          <WalletConnector />
        </div>
      </div>
    </div>
  );
}
