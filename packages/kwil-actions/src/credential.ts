import type { idOSCredential } from "@idos-network/idos-sdk-types";
import type { KwilActionClient } from "./create-kwil-client";

/**
 * Get a credential shared with the signer in the idOS.
 */
export async function getSharedCredential(kwilClient: KwilActionClient, id: string) {
  const records = await kwilClient.call<idOSCredential[]>({
    name: "get_credential_shared",
    inputs: { id },
  });
  const credential = records.find((record) => record.id === id);

  return credential;
}
