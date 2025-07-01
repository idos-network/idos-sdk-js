import { effect } from "@preact/signals";
import { useAppKitAccount } from "@reown/appkit/react";
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
  const { address } = useAppKitAccount();

  effect(() => {
    if (walletPayload.value && address) {
      // @todo: post message back to the dashboard
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
