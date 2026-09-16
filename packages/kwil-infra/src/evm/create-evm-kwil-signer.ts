import type { Store } from "@idos-network/utils/store";
import type { JsonRpcSigner } from "ethers";

import { KwilSigner } from "@idos-network/kwil-js";

import type { KwilActionClient } from "../create-kwil-client";
import type { ClientKwilSignerResult } from "../create-kwil-signer";

export async function createEvmKwilSigner(
  signer: JsonRpcSigner,
  store: Store,
  kwilClient: KwilActionClient,
): Promise<ClientKwilSignerResult> {
  const currentAddress = await signer.getAddress();

  const storedAddress = await store.get<string>("signer-address");

  if (storedAddress !== currentAddress) {
    // To avoid re-using the old signer's kgw cookie.
    // When kwil-js supports multi cookies, we can remove this.
    store.set("signer-address", currentAddress);
    try {
      await kwilClient.client.auth.logoutKGW();
    } catch (error) {
      console.log("error logoutKGW", error);
    }
  }

  return {
    kwilSigner: new KwilSigner(signer, currentAddress),
    walletIdentifier: currentAddress,
    walletPublicKey: undefined,
    walletType: "EVM",
  };
}
