import type { ChainProvider } from "../types";
import MetaMask from "./MetaMask";

export default function Eth({ addWallets }: ChainProvider) {
  return (
  <div>
    <button type="button" onClick={async () => {
      if (MetaMask.isAvailable()) {
        addWallets(await MetaMask.init());
      } else {
        console.log("-> MetaMask is not available");
      }
    }}>
      Metamask
    </button>
  </div>);
}
