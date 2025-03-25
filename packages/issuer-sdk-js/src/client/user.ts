import {
  type DelegatedWriteGrantSignatureRequest,
  getUserProfile as _getUserProfile,
  hasProfile as _hasProfile,
  requestDWGMessage as _requestDWGMessage,
} from "@idos-network/core";
import type { IssuerConfig } from "./create-issuer-config";

export async function hasProfile({ kwilClient, userAddress }: IssuerConfig) {
  return _hasProfile(kwilClient, userAddress);
}

export async function requestDWGMessage(
  { kwilClient }: IssuerConfig,
  params: DelegatedWriteGrantSignatureRequest,
) {
  return _requestDWGMessage(kwilClient, params);
}

export async function getUserProfile({ kwilClient }: IssuerConfig) {
  const user = await _getUserProfile(kwilClient);
  return user;
}

/**
 * Get the public key of the user's encryption key
 */
export async function getUserEncryptionPublicKey(
  { enclaveProvider }: IssuerConfig,
  userId: string,
) {
  return await enclaveProvider.discoverUserEncryptionPublicKey(userId);
}
