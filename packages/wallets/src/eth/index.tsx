import { WalletIcon } from "@web3icons/react";
import type { ChainProvider } from "../types";
import WalletConnect from "./WalletConnect";
import { useEffect } from "react";

export default function Eth({ addWallets }: ChainProvider): React.ReactNode {
  const onClick = async () => {
    addWallets(await WalletConnect.init());
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: componentDidMount on purpose
  useEffect(() => {
    onClick();
  }, []);

  return (
    <>
      <h1>Ethereum</h1>
      <div className="buttons-container">
        <button
          type="button"
          onClick={async () => {
            addWallets(await WalletConnect.init());
          }}
        >
          <WalletIcon id="wallet-connect" variant="branded" size="36" />
          WalletConnect
        </button>
      </div>
    </>
  );
}
