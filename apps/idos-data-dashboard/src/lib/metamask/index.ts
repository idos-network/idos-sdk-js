import { Utils } from "@kwilteam/kwil-js";
import { BrowserProvider } from "ethers";

export async function setupMetamask() {
  const provider = new BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const publicKey = await Utils.recoverSecp256k1PubKey(signer);

  return {
    publicKey,
    signer,
  };
}
