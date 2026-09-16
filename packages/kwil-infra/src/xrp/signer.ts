import type * as GemWallet from "@gemwallet/api";
import type { Store } from "@idos-network/utils/store";
import type { Xumm } from "xumm";

import { KwilSigner } from "@idos-network/kwil-js";

import type { KwilActionClient } from "../create-kwil-client";
import type { ClientKwilSignerResult } from "../create-kwil-signer";

import { getXrpPublicKey, getXrpTxHash } from "./utils";

export async function createXrpKwilSigner(
  wallet: Xumm | typeof GemWallet,
  store: Store,
  kwilClient: KwilActionClient,
): Promise<ClientKwilSignerResult> {
  const { address: currentAddress, publicKey: walletPublicKey } = (await getXrpPublicKey(
    wallet,
  )) as { address: string; publicKey: string };
  if (!currentAddress) {
    throw new Error("Failed to get XRP address");
  }

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

  return {
    kwilSigner: new KwilSigner(signer, walletPublicKey, "xrpl"),
    walletIdentifier: currentAddress,
    walletPublicKey,
    walletType: "XRPL",
  };
}
