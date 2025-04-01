import {
  type DelegatedWriteGrantSignatureRequest,
  getUserProfile as _getUserProfile,
  hasProfile as _hasProfile,
  requestDWGMessage as _requestDWGMessage,
} from "@idos-network/core/kwil-actions";
import type { IssuerClientConfig } from "./create-issuer-client-config";

export async function hasProfile({ kwilClient, userAddress }: IssuerClientConfig) {
  return _hasProfile(kwilClient, userAddress);
}

export async function requestDWGMessage(
  { kwilClient }: IssuerClientConfig,
  params: DelegatedWriteGrantSignatureRequest,
) {
  return _requestDWGMessage(kwilClient, params);
}

export async function getUserProfile({ kwilClient }: IssuerClientConfig) {
  const user = await _getUserProfile(kwilClient);
  return user;
}

/**
 * Get the public key of the user's encryption key
 */
export async function getUserEncryptionPublicKey(
  { enclaveProvider }: IssuerClientConfig,
  userId: string,
) {
  await enclaveProvider.load();
  await enclaveProvider.reset();
  await enclaveProvider.ready(userId);
  return await enclaveProvider.discoverUserEncryptionPublicKey(userId);
}
