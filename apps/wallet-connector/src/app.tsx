import { EVMConnector } from "@/components/evm-connector";
import { NearConnector } from "@/components/near-connector";
import { StellarConnector } from "@/components/stellar-connector";
import { XRPLConnector } from "@/components/xrpl-connector";
import { useIsMobile } from "@/hooks/use-mobile";
import { useStore } from "@/state";

function Center({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full items-center justify-center gap-6 p-6 max-w-sm mx-auto">
      <div className="flex flex-col gap-4 items-stretch w-full">{children}</div>
    </div>
  );
}

function App() {
  const connectedWallet = useStore((state) => state.connectedWallet);
  const { isMobile } = useIsMobile();

  if (isMobile) {
    return (
      <Center>
        <EVMConnector />
        <p className="text-center text-accent-foreground text-sm">
          In order to add more wallets to your idOS profile, please use a desktop browser.
        </p>
      </Center>
    );
  }

  if (connectedWallet === "evm") {
    return (
      <Center>
        <EVMConnector />
      </Center>
    );
  }

  if (connectedWallet === "near") {
    return (
      <Center>
        <NearConnector />
      </Center>
    );
  }

  if (connectedWallet === "stellar") {
    return (
      <Center>
        <StellarConnector />
      </Center>
    );
  }

  if (connectedWallet === "xrpl") {
    return (
      <Center>
        <XRPLConnector />
      </Center>
    );
  }

  return (
    <Center>
      <EVMConnector />
      <NearConnector />
      <StellarConnector />
      <XRPLConnector />
    </Center>
  );
}

export default App;
