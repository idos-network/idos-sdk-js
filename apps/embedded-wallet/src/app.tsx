import { effect } from "@preact/signals";
import { useAppKitAccount } from "@reown/appkit/react";
import { EVMConnector } from "./components/evm";
import { NearConnector } from "./components/near";
import { signature } from "./state";

export function App() {
  const { address } = useAppKitAccount();

  effect(() => {
    if (signature.value && address) {
      // @todo: post back
    }
  });

  return (
    <div class="grid h-full place-content-center">
      <div class="flex flex-col gap-4">
        <div class="flex flex-col items-stretch justify-center gap-4">
          <EVMConnector />
          <NearConnector />
        </div>
      </div>
    </div>
  );
}
