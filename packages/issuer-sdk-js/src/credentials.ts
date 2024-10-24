import * as base64 from "@stablelib/base64";
import * as utf8Codec from "@stablelib/utf8";
import type { idOSCredential } from "../../types";
import type { IssuerConfig } from "./create-issuer-config";
import { createActionInput, encrypt, ensureEntityId } from "./internal";

// Base interface for credential parameters
interface BaseCredentialParams extends Omit<idOSCredential, "id" | "original_id"> {
  id?: string;
}

const encryptContent = (content: string, encryptionSecret: string, encryptionPublicKey: string) => {
  const endodedContent = utf8Codec.encode(content);
  const decodedEncryptionPublicKey = base64.decode(encryptionPublicKey);
  const decodedSecretKey = base64.decode(encryptionSecret);

  try {
    return encrypt(endodedContent, decodedEncryptionPublicKey, decodedSecretKey);
  } catch (error) {
    throw new Error(`Encryption failed: ${(error as Error).message}`);
  }
};

interface CreateCredentialPermissionedParams extends BaseCredentialParams {}

export async function createCredentialPermissioned(
  { dbid, kwilClient, encryptionSecret, signer }: IssuerConfig,
  params: CreateCredentialPermissionedParams,
): Promise<idOSCredential> {
  const encryptedContent = await encryptContent(
    params.content,
    encryptionSecret,
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

interface CreateCredentialByGrantParams extends BaseCredentialParams {}

export async function createCredentialByGrant(
  { dbid, kwilClient, encryptionSecret, signer }: IssuerConfig,
  params: CreateCredentialByGrantParams,
): Promise<idOSCredential> {
  const encryptedContent = await encryptContent(
    params.content,
    encryptionSecret,
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

interface ShareCredentialByGrantParams extends BaseCredentialParams {
  grantee: string;
  locked_until: number;
  original_credential_id: string;
}

export async function shareCredentialByGrant(
  { dbid, kwilClient, encryptionSecret, signer }: IssuerConfig,
  params: ShareCredentialByGrantParams,
): Promise<idOSCredential> {
  const encryptedContent = await encryptContent(
    params.content,
    encryptionSecret,
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
