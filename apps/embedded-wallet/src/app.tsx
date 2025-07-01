import { effect } from "@preact/signals";
import { EVMConnector } from "./components/evm";
import { NearConnector } from "./components/near";
import { connectedWalletType, walletPayload } from "./state";

function WalletConnector() {
  if (!connectedWalletType.value) {
    return (
      <>
        <EVMConnector />
        <NearConnector />
      </>
    );
  }

  if (connectedWalletType.value === "evm") {
    return <EVMConnector />;
  }

  if (connectedWalletType.value === "near") {
    return <NearConnector />;
  }

  return null;
}

export function App() {
  effect(() => {
    if (walletPayload.value) {
      // Send wallet payload back to the parent window
      if (window.opener) {
        console.log("Sending wallet payload to parent window:", walletPayload.value);

        window.opener.postMessage(
          {
            type: "WALLET_SIGNATURE",
            data: walletPayload.value,
          },
          "https://localhost:5173", // Send only to parent window's origin
        );

        // Close the popup window after sending the data
        window.close();
      } else {
        console.log("No opener window found");
      }
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
