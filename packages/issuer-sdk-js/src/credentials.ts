import * as Base64Codec from "@stablelib/base64";
import * as Utf8Codec from "@stablelib/utf8";
import type { idOSCredential } from "../../types";
import type { IssuerConfig } from "./create-issuer-config";
import { createActionInput, encryptContent, ensureEntityId } from "./internal";

// Base interface for credential parameters
interface BaseCredentialParams
  extends Omit<idOSCredential, "id" | "original_id" | "encryption_public_key"> {
  id?: string;
}

interface HasEncryptionPublicKey {
  userEncryptionPublicKey: string;
}

interface CreateCredentialPermissionedParams extends BaseCredentialParams, HasEncryptionPublicKey {}

export async function createCredentialPermissioned(
  { dbid, kwilClient, keyPair, signer }: IssuerConfig,
  params: CreateCredentialPermissionedParams,
): Promise<idOSCredential> {
  const encryptedContent = await encryptContent(
    Utf8Codec.encode(params.content),
    Base64Codec.decode(params.userEncryptionPublicKey),
    keyPair.secretKey,
  );

  const payload = {
    ...ensureEntityId(params),
    content: encryptedContent,
    encryption_public_key: Base64Codec.encode(keyPair.publicKey),
  };
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

interface CreateCredentialByGrantParams extends BaseCredentialParams, HasEncryptionPublicKey {}

export async function createCredentialByGrant(
  { dbid, kwilClient, keyPair, signer }: IssuerConfig,
  params: CreateCredentialByGrantParams,
): Promise<idOSCredential> {
  const encryptedContent = await encryptContent(
    Utf8Codec.encode(params.content),
    Base64Codec.decode(params.userEncryptionPublicKey),
    keyPair.secretKey,
  );

  const payload = {
    ...ensureEntityId(params),
    content: encryptedContent,
    encryption_public_key: Base64Codec.encode(keyPair.publicKey),
  };
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

interface ShareCredentialByGrantParams extends BaseCredentialParams, HasEncryptionPublicKey {
  grantee: string;
  locked_until: number;
  original_credential_id: string;
}

export async function shareCredentialByGrant(
  { dbid, kwilClient, keyPair, signer }: IssuerConfig,
  params: ShareCredentialByGrantParams,
): Promise<idOSCredential> {
  const encryptedContent = await encryptContent(
    Utf8Codec.encode(params.content),
    Base64Codec.decode(params.userEncryptionPublicKey),
    keyPair.secretKey,
  );

  const payload = {
    ...ensureEntityId(params),
    content: encryptedContent,
    encryption_public_key: Base64Codec.encode(keyPair.publicKey),
  };
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
