import type * as GemWallet from "@gemwallet/api";
import { KwilSigner } from "@kwilteam/kwil-js";
import type { Xumm } from "xumm";
import type { Store } from "../store";
import { getXrpTxHash } from "../xrp";
import type { KwilActionClient } from "./create-kwil-client";

export async function createXrpKwilSigner(
  wallet: Xumm | typeof GemWallet,
  currentAddress: string,
  store: Store,
  kwilClient: KwilActionClient,
  walletPublicKey: string,
): Promise<KwilSigner> {
  const storedAddress = store.get("signer-address");
  const storePublicKey = store.get("signer-public-key");

  if (storedAddress !== currentAddress || (storePublicKey && storePublicKey !== walletPublicKey)) {
    try {
      // HEADS UP: for some reason logoutKGW fails on xrp
      // storePublicKey && await kwilClient.client.auth.logoutKGW();
      console.log("logoutKGW", kwilClient);
    } catch (error) {
      console.error("Failed to logout KGW:", error);
    }
  }

  store.set("signer-address", currentAddress);
  store.set("signer-public-key", walletPublicKey);

  const signer = async (message: string | Uint8Array): Promise<Uint8Array> => {
    const signature = await getXrpTxHash(message, wallet);
    if (!signature) {
      throw new Error("Failed to sign transaction with XRP");
    }
    return Buffer.from(signature, "hex");
  };

  return new KwilSigner(signer, walletPublicKey, "xrpl");
}
