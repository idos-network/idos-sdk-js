import { effect } from "@preact/signals";
import { EVMConnector } from "./components/evm";
import { NearConnector } from "./components/near";
import { StellarConnector } from "./components/stellar";
import { XRPLConnector } from "./components/xrp";
import { connectedWalletType, walletPayload } from "./state";

const getHiddenWalletTypes = () => {
  const params = new URLSearchParams(window.location.search);
  const hiddenWallets = params.get("skip_wallets") ?? "";
  return hiddenWallets ? hiddenWallets.split(",") : [];
};

const hiddenWalletType = getHiddenWalletTypes();

const getOpenerOrigin = () => {
  try {
    if (!document.referrer) {
      console.warn("Document referrer is empty; unable to derive opener origin");
      return null;
    }

    return new URL(document.referrer).origin;
  } catch (error) {
    console.warn("Failed to derive opener origin from document referrer", error);
    return null;
  }
};

function WalletConnector() {
  if (!connectedWalletType.value) {
    return (
      <>
        {!hiddenWalletType.includes("evm") && <EVMConnector />}
        {!hiddenWalletType.includes("near") && <NearConnector />}
        {!hiddenWalletType.includes("xrpl") && <XRPLConnector />}
        {!hiddenWalletType.includes("stellar") && <StellarConnector />}
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
      if (!window.opener) {
        console.log("No opener window found");
        return;
      }

      const targetOrigin = getOpenerOrigin();
      if (!targetOrigin) {
        console.warn("Target origin is not available; aborting `postMessage`");
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
            targetOrigin,
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
