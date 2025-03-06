import {
  type DelegatedWriteGrantSignatureRequest,
  getUserProfile as _getUserProfile,
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

export async function getUserProfile({ kwilClient }: IssuerConfig) {
  const user = await _getUserProfile(kwilClient);
  return user;
}
