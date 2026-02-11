import type * as GemWallet from "@gemwallet/api";
import { KwilSigner } from "@idos-network/kwil-js";
import type { Store } from "@idos-network/utils/store";
import type { Xumm } from "xumm";
import type { KwilActionClient } from "../create-kwil-client";
import { getXrpTxHash } from "./utils";

export async function createXrpKwilSigner(
  wallet: Xumm | typeof GemWallet,
  currentAddress: string,
  store: Store,
  kwilClient: KwilActionClient,
  walletPublicKey: string,
): Promise<KwilSigner> {
  const storedAddress = await store.get<string>("signer-address");
  const storePublicKey = await store.get<string>("signer-public-key");

  if (storedAddress !== currentAddress || (storePublicKey && storePublicKey !== walletPublicKey)) {
    try {
      // HEADS UP: for some reason logoutKGW fails on xrp
      // storePublicKey && await kwilClient.client.auth.logoutKGW();
      console.log("logoutKGW", kwilClient);
    } catch (error) {
      console.error("Failed to logout KGW:", error);
    }
  }

  await store.set("signer-address", currentAddress);
  await store.set("signer-public-key", walletPublicKey);

  const signer = async (message: string | Uint8Array): Promise<Uint8Array> => {
    const signature = await getXrpTxHash(message, wallet);
    if (!signature) {
      throw new Error("Failed to sign transaction with XRP");
    }
    return Buffer.from(signature, "hex");
  };

  return new KwilSigner(signer, walletPublicKey, "xrpl");
}
