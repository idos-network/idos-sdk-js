import {
  shareCredential as _shareCredential,
  getCredentialById,
} from "@idos-network/core/kwil-actions";
import invariant from "tiny-invariant";
import type { IssuerClientConfig } from "./create-issuer-client-config";

export async function shareCredential({ kwilClient }: IssuerClientConfig, id: string) {
  const credential = await getCredentialById(kwilClient, id);
  invariant(credential, `"idOSCredential" with id ${id} not found`);

  await _shareCredential(kwilClient, {
    ...credential,
    original_credential_id: credential.id,
  });
}
