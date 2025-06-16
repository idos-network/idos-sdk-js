import type { ChainProvider } from "../types";
import GemWallet from "./GemWallet";

export default function Xrp({ addWallets }: ChainProvider) {
  return (
  <div>
    <button type="button" onClick={async () => {
      if (await GemWallet.isAvailable()) {
        addWallets(await GemWallet.init());
      } else {
        console.log("-> GemWallet is not available");
      }
    }}>
      GemWallet
    </button>
  </div>);
}
