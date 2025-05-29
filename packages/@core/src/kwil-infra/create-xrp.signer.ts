import type * as GemWallet from "@gemwallet/api";
import { KwilSigner } from "@kwilteam/kwil-js";
import type { Xumm } from "xumm";
import type { Store } from "../store";
import { getXrpPublicKey, getXrpTxHash } from "../xrp";
import type { KwilActionClient } from "./create-kwil-client";

export async function createXrpKwilSigner(
  wallet: Xumm | typeof GemWallet,
  currentAddress: string,
  store: Store,
  kwilClient: KwilActionClient,
): Promise<KwilSigner> {
  const storedAddress = store.get("signer-address");
  let publicKey = store.get("signer-public-key");

  if (storedAddress !== currentAddress || !publicKey) {
    try {
      storedAddress && (await kwilClient.client.auth.logoutKGW());
      publicKey = await getXrpPublicKey(wallet);

      store.set("signer-address", currentAddress);
      store.set("signer-public-key", publicKey);
    } catch (error) {
      console.error("Failed to logout KGW:", error);
    }
  }

  const signer = async (message: string | Uint8Array): Promise<Uint8Array> => {
    const signature = await getXrpTxHash(message, wallet);
    if (!signature) {
      throw new Error("Failed to sign transaction with XRP");
    }
    return Buffer.from(signature, "hex");
  };

  return new KwilSigner(signer, publicKey, "xrpl");
}
