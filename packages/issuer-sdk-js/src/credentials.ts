import * as base64 from "@stablelib/base64";
import * as utf8Codec from "@stablelib/utf8";
import type { idOSCredential } from "../../types";
import type { IssuerConfig } from "./create-issuer-config";
import { createActionInput, encrypt, ensureEntityId } from "./internal";

export interface CreateCredentialReqParams extends Omit<idOSCredential, "id" | "original_id"> {
  id?: string;
}
type CredentialReqParams = Omit<idOSCredential, "original_id">;

const encryptContent = (content: string, secretKey: string, encryptionPublicKey: string) => {
  const endodedContent = utf8Codec.encode(content);
  const decodedEncryptionPublicKey = base64.decode(encryptionPublicKey);
  const decodedSecretKey = base64.decode(secretKey);

  try {
    return encrypt(endodedContent, decodedEncryptionPublicKey, decodedSecretKey);
  } catch (error) {
    throw new Error(`Encryption failed: ${(error as Error).message}`);
  }
};

export interface CreateCredentialPermissionedReqParams extends CredentialReqParams {}

export async function createCredentialPermissioned(
  { dbid, kwilClient, secretKey, signer }: IssuerConfig,
  params: CreateCredentialPermissionedReqParams,
): Promise<idOSCredential> {
  const encryptedContent = await encryptContent(
    params.content,
    secretKey,
    params.encryption_public_key,
  );

  const payload = { ...ensureEntityId(params), content: encryptedContent };
  await kwilClient.execute(
    {
      name: "upsert_credential_as_inserter",
      dbid,
      inputs: [createActionInput(payload)],
    },
    signer,
    true,
  );

  return {
    ...payload,
    original_id: "",
  };
}

export interface createCredentialByGrantReqParams extends CredentialReqParams {}

export async function createCredentialByGrant(
  { dbid, kwilClient, secretKey, signer }: IssuerConfig,
  params: createCredentialByGrantReqParams,
): Promise<idOSCredential> {
  const encryptedContent = await encryptContent(
    params.content,
    secretKey,
    params.encryption_public_key,
  );

  const payload = { ...ensureEntityId(params), content: encryptedContent };
  await kwilClient.execute(
    {
      name: "add_credential_by_write_grant",
      dbid,
      inputs: [createActionInput(payload)],
    },
    signer,
    true,
  );

  return {
    ...payload,
    original_id: "",
  };
}
export interface ShareCredentialByGrantReqParams extends CredentialReqParams {
  grantee: string;
  locked_until: number;
  original_credential_id: string;
}
export async function shareCredentialByGrant(
  { dbid, kwilClient, secretKey, signer }: IssuerConfig,
  params: ShareCredentialByGrantReqParams,
): Promise<idOSCredential> {
  const encryptedContent = await encryptContent(
    params.content,
    secretKey,
    params.encryption_public_key,
  );

  const payload = { ...ensureEntityId(params), content: encryptedContent };
  await kwilClient.execute(
    {
      name: "share_credential_by_write_grant",
      dbid,
      inputs: [createActionInput(payload)],
    },
    signer,
    true,
  );

  const { original_credential_id, ...rest } = payload;

  return {
    ...rest,
    original_id: original_credential_id,
  };
}
