import { type EnclaveOptions, IframeEnclave } from "@idos-network/controllers/secure-enclave";
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

/**
 * Get the public key of the user's encryption key
 */
export async function getUserEncryptionPublicKey(
  userId: string,
  enclaveOptions: Omit<EnclaveOptions, "mode">,
) {
  let enclave: IframeEnclave | null = new IframeEnclave({
    ...enclaveOptions,
    mode: "new",
  });

  await enclave.load();
  await enclave.reset();
  const publicKey = await enclave.discoverUserEncryptionPublicKey(userId);
  enclave = null;
  document.querySelector(enclaveOptions.container)?.children[0].remove();

  return publicKey;
}
