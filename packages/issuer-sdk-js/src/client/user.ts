import { type EnclaveOptions, IframeEnclave } from "@idos-network/controllers/enclave";
import {
  type DelegatedWriteGrantSignatureRequest,
  getUserProfile as _getUserProfile,
  requestDWGMessage as _requestDWGMessage,
  hasProfile,
} from "@idos-network/core";
import type { IssuerConfig } from "./create-issuer-config";

export async function checkUserProfile({ kwilClient }: IssuerConfig, address: string) {
  return hasProfile(kwilClient, address);
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
  userId: string,
  enclaveOptions: Omit<EnclaveOptions, "mode">,
) {
  // TODO(pkoch): this should be provided as an argument
  let enclaveProvider: IframeEnclave | null = new IframeEnclave({
    ...enclaveOptions,
    mode: "new",
  });

  await enclaveProvider.load();
  await enclaveProvider.reset(); // TODO(pkoch): this should not be called here, as it wipes the password
  const publicKey = await enclaveProvider.discoverUserEncryptionPublicKey(userId);
  enclaveProvider = null;
  document.querySelector(enclaveOptions.container)?.children[0].remove();

  return publicKey;
}
