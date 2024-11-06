import * as Base64Codec from "@stablelib/base64";
import * as Utf8Codec from "@stablelib/utf8";
import type { idOSCredential, idOSCredential2 } from "../../types";
import type { IssuerConfig, IssuerConfig2 } from "./create-issuer-config";
import { createActionInput, encryptContent, ensureEntityId } from "./internal";

// Base interface for credential parameters
interface BaseCredentialParams extends Omit<idOSCredential, "id" | "original_id"> {
  id?: string;
}

interface HasUserEncryptionPublicKey {
  userEncryptionPublicKey: string;
}

interface CreateCredentialPermissionedParams
  extends BaseCredentialParams,
  HasUserEncryptionPublicKey { }

export async function createCredentialPermissioned(
  { dbid, kwilClient, encryptionSecret, signer }: IssuerConfig,
  params: CreateCredentialPermissionedParams,
): Promise<idOSCredential> {
  const encryptedContent = await encryptContent(
    Utf8Codec.encode(params.content),
    Base64Codec.decode(params.userEncryptionPublicKey),
    Base64Codec.decode(encryptionSecret),
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

type CreateCredential2 = {
  id?: string;
  human_id: string;
  issuer: string;
  content: string;
  encryption_public_key: string;
  public_notes: string;
  public_notes_signature: string;
  broader_signature: string;
};
export async function createCredentialPermissioned2(
  { dbid, kwilClient, signer }: IssuerConfig2,
  params: CreateCredential2,
): Promise<idOSCredential2> {
  const payload = ensureEntityId(params);

  await kwilClient.execute(
    {
      name: "upsert_credential_as_inserter2",
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

interface CreateCredentialByGrantParams extends BaseCredentialParams, HasUserEncryptionPublicKey { }

export async function createCredentialByGrant(
  { dbid, kwilClient, encryptionSecret, signer }: IssuerConfig,
  params: CreateCredentialByGrantParams,
): Promise<idOSCredential> {
  const encryptedContent = await encryptContent(
    Utf8Codec.encode(params.content),
    Base64Codec.decode(params.userEncryptionPublicKey),
    Base64Codec.decode(encryptionSecret),
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
export async function createCredentialByGrant2(
  { dbid, kwilClient, signer }: IssuerConfig2,
  params: CreateCredential2,
): Promise<idOSCredential2> {
  const payload = ensureEntityId(params);
  await kwilClient.execute(
    {
      name: "add_credential_by_write_grant2",
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

interface ShareCredentialByGrantParams extends BaseCredentialParams, HasUserEncryptionPublicKey {
  grantee: string;
  locked_until: number;
  original_credential_id: string;
}

export async function shareCredentialByGrant(
  { dbid, kwilClient, encryptionSecret, signer }: IssuerConfig,
  params: ShareCredentialByGrantParams,
): Promise<idOSCredential> {
  const encryptedContent = await encryptContent(
    Utf8Codec.encode(params.content),
    Base64Codec.decode(params.userEncryptionPublicKey),
    Base64Codec.decode(encryptionSecret),
  );

  const payload = { ...ensureEntityId(params), content: encryptedContent };
  // TODO: creds2: What should I do here?
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
