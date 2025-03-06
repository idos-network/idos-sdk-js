import { shareCredential as _shareCredential, getCredentialById } from "@idos-network/core";
import invariant from "tiny-invariant";
import type { IssuerConfig } from "./create-issuer-config";

export async function shareCredential({ kwilClient }: IssuerConfig, id: string) {
  const credential = await getCredentialById(kwilClient, id);
  invariant(credential, `"idOSCredential" with id ${id} not found`);

  await _shareCredential(kwilClient, credential);
}
