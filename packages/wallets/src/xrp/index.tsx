import type { ChainProvider } from "../types";
import GemWallet from "./GemWallet";
import GemWalletIcon from "./icons";

export default function Xrp({ addWallets }: ChainProvider) {
  return (
    <>
      <h1>XRP</h1>
    <div className="buttons-container">
      <button
        type="button"
        onClick={async () => {
          if (await GemWallet.isAvailable()) {
            addWallets(await GemWallet.init());
          } else {
            console.log("-> GemWallet is not available");
          }
        }}
      >
        <GemWalletIcon size={36} />
        GemWallet
      </button>
    </div>
    </>
  );
}
