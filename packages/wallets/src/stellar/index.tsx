import type { ChainProvider } from "../types";
import Freighter from "./Freighter";

export default function Stellar({ addWallets }: ChainProvider) {
  return (
    <>
      <h1>Stellar</h1>
      <div className="buttons-container">
        <button
          type="button"
          onClick={async () => {
            if (await Freighter.isAvailable()) {
              addWallets(await Freighter.init());
            } else {
              console.log("-> Freighter is not available");
            }
          }}
        >
          Freighter
        </button>
      </div>
    </>
  );
}
