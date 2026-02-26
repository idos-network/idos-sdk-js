import type { WalletType } from "@idos-network/kwil-infra/actions";
import { useEffect, useState } from "react";
import { EVMConnector } from "./components/evm";
import { NearConnector } from "./components/near";
import { StellarConnector, stellarKit } from "./components/stellar";
import { XRPLConnector } from "./components/xrp";
import { useWalletState } from "./state";

const urlParams = new URLSearchParams(window.location.search);

const getHiddenWalletTypes = (): string[] => {
  const hiddenWallets = urlParams.get("skip_wallets") ?? "";
  return hiddenWallets ? hiddenWallets.split(",") : [];
};

const hiddenWalletType = getHiddenWalletTypes();

/** The Stellar address the dashboard is currently connected with (if any). */
const dashboardStellarAddress = urlParams.get("stellar_address");

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
      {showWallet("EVM") && <EVMConnector />}
      {showWallet("NEAR") && <NearConnector />}
      {showWallet("XRPL") && <XRPLConnector />}
      {showWallet("Stellar") && <StellarConnector />}
    </>
  );
}

export function App() {
  const { walletPayload, connectedWalletType } = useWalletState();
  const [waitingForStellarSwitch, setWaitingForStellarSwitch] = useState(false);

  /** Send the signed payload to the dashboard and close the popup. */
  const sendPayloadAndClose = () => {
    if (!walletPayload || !connectedWalletType) return;
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
  };

  // When the wallet payload is ready, check if the user needs to switch
  // back to the dashboard's Stellar account before we close.
  useEffect(() => {
    if (!walletPayload || !connectedWalletType) return;

    // Only relevant when the dashboard is connected with Stellar AND
    // the wallet just added in this popup was also Stellar.
    if (!dashboardStellarAddress || connectedWalletType !== "Stellar") {
      sendPayloadAndClose();
      return;
    }

    // Check if the Stellar extension is still on the dashboard's account.
    (async () => {
      try {
        const { address } = await stellarKit.getAddress();
        if (address === dashboardStellarAddress) {
          sendPayloadAndClose();
        } else {
          setWaitingForStellarSwitch(true);
        }
      } catch {
        // Can't query the extension — proceed anyway.
        sendPayloadAndClose();
      }
    })();
  }, [walletPayload, connectedWalletType]);

  // Poll every 5 s until the user switches back to the original account.
  useEffect(() => {
    if (!waitingForStellarSwitch || !dashboardStellarAddress) return;

    const interval = setInterval(async () => {
      try {
        const { address } = await stellarKit.getAddress();
        if (address === dashboardStellarAddress) {
          clearInterval(interval);
          setWaitingForStellarSwitch(false);
          sendPayloadAndClose();
        }
      } catch {
        // Silently retry on next tick.
      }
    }, 5_000);

    return () => clearInterval(interval);
  }, [waitingForStellarSwitch]);

  if (waitingForStellarSwitch) {
    return (
      <div className="grid h-full place-content-center p-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <h2 className="font-bold text-xl">Switch back to your dashboard account</h2>
          <p className="text-neutral-400 text-sm">
            Please switch your Stellar wallet extension back to the account you use on the
            dashboard:
          </p>
          <p className="break-all rounded bg-neutral-800 px-3 py-2 font-mono text-xs">
            {dashboardStellarAddress}
          </p>
          <p className="text-neutral-500 text-xs">Checking every 5 seconds…</p>
        </div>
      </div>
    );
  }

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
