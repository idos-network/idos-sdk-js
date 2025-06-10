import { KwilSigner } from "@kwilteam/kwil-js";
import type { Store } from "../store";
import type { WalletInfo } from "../types";
import { getXrpTxHash } from "../xrp";
import type { KwilActionClient } from "./create-kwil-client";

export async function createXrpKwilSigner(
  wallet: WalletInfo,
  store: Store,
  kwilClient: KwilActionClient,
): Promise<KwilSigner> {
  const storedAddress = store.get("signer-address");
  const storePublicKey = store.get("signer-public-key");

  if (storedAddress !== wallet.address || (storePublicKey && storePublicKey !== wallet.publicKey)) {
    try {
      // HEADS UP: for some reason logoutKGW fails on xrp
      // storePublicKey && await kwilClient.client.auth.logoutKGW();
      console.log("logoutKGW", kwilClient);
    } catch (error) {
      console.error("Failed to logout KGW:", error);
    }
  }

  store.set("signer-address", wallet.address);
  store.set("signer-public-key", wallet.publicKey);

  const signer = async (message: string | Uint8Array): Promise<Uint8Array> => {
    const signature = await getXrpTxHash(message, wallet);
    if (!signature) {
      throw new Error("Failed to sign transaction with XRP");
    }
    return Buffer.from(signature, "hex");
  };

  return new KwilSigner(signer, wallet.publicKey, "xrpl");
}
