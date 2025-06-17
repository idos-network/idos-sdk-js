import type { ChainProvider } from "../types";
import { MeteorIcon, HereIcon } from "./icons";
import NearSelector from "./NearSelector";

export default function Near({ addWallets }: ChainProvider): React.ReactNode {
  const setWallet = async (type: "meteor-wallet" | "here-wallet" | "my-near-wallet") => {
    addWallets(await NearSelector.init(type));
  };

  return (
    <>
      <h1>Near</h1>
      <div className="buttons-container">
        <button type="button" onClick={() => setWallet("meteor-wallet")}>
          <MeteorIcon size={36} />
          Meteor
        </button>
        <button type="button" onClick={() => setWallet("here-wallet")}>
          <HereIcon size={36} />
          Here
        </button>
        <button type="button" onClick={() => setWallet("my-near-wallet")}>
          My Near
        </button>
      </div>
    </>
  );
}
