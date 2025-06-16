import type { ChainProvider } from "../types";
import NearSelector from "./NearSelector";

export default function Near({ addWallets }: ChainProvider) {
  const setWallet = async (type: "meteor-wallet" | "here-wallet" | "my-near-wallet") => {
    addWallets(await NearSelector.init(type));
  }

  return (
    <div>
      <button type="button" onClick={() => setWallet("meteor-wallet")}>
        Meteor
      </button>
      <button type="button" onClick={() => setWallet("here-wallet")}>
        Here
      </button>
      <button type="button" onClick={() => setWallet("my-near-wallet")}>
        My Near
      </button>
    </div>
  );
}
