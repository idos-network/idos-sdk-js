import type { idOSCredential } from "@idos-network/idos-sdk-types";
import type { KwilActionClient } from "./create-kwil-client";

/**
 * Returns the shared idOS Cedential for the given `dataId`.
 */
export function getSharedCredential(kwilClient: KwilActionClient, dataId: string) {
  return kwilClient.call<[idOSCredential]>({
    name: "get_credential_shared",
    inputs: { id: dataId },
  });
}
