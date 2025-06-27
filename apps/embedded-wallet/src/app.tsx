import { effect } from "@preact/signals";
import { useAppKitAccount } from "@reown/appkit/react";
import { EthereumConnector } from "./components/ethereum";
import { signature } from "./state";

export function App() {
  const { address } = useAppKitAccount();

  effect(() => {
    if (signature.value && address) {
      window.parent.postMessage(
        {
          type: "WALLET_SIGNATURE",
          data: {
            address,
            signature: signature.value,
            message: "Sign this message to prove you own this wallet",
          },
        },
        "https://localhost:5174",
      );
    }
  });

  return (
    <div class="grid h-full place-content-center">
      <div class="flex flex-col gap-4">
        <div class="flex flex-col items-center justify-center gap-4">
          <EthereumConnector />
        </div>
      </div>
    </div>
  );
}
