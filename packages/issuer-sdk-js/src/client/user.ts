import {
  type DelegatedWriteGrantSignatureRequest,
  requestDWGSignature as _requestDWGSignature,
  hasProfile,
} from "@idos-network/core";

import type { IssuerConfig } from "./create-issuer-config";

export async function checkUserProfile({ kwilClient }: IssuerConfig, address: string) {
  return hasProfile(kwilClient, address);
}

export async function requestDWGSignature(
  { kwilClient }: IssuerConfig,
  params: DelegatedWriteGrantSignatureRequest,
) {
  return _requestDWGSignature(kwilClient, params);
}
