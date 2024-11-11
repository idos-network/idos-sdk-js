import type { idOSCredential, idOSCredential2 } from "@idos-network/idos-sdk-types";
import * as Base64Codec from "@stablelib/base64";
import * as Utf8Codec from "@stablelib/utf8";
import { omit } from "es-toolkit";
import nacl from "tweetnacl";
import type { IssuerConfig, IssuerConfig2 } from "./create-issuer-config";
import { createActionInput, encryptContent, ensureEntityId } from "./internal";

export type InsertableIdosCredential2 = Omit<idOSCredential2, "id" | "original_id"> & {
  id?: idOSCredential2["id"];
};
export const buildInsertableIdosCredential2 = (
  issuerConfig: IssuerConfig2,
  {
    humanId,
    publicNotes,
    plaintextContent,
    receiverEncryptionPublicKey,
  }: {
    humanId: string;
    publicNotes: string;
    plaintextContent: Uint8Array;
    receiverEncryptionPublicKey: Uint8Array;
  },
): InsertableIdosCredential2 => {
  const content = Base64Codec.decode(
    encryptContent(plaintextContent, receiverEncryptionPublicKey, issuerConfig.encrypter.secretKey),
  );
  const publicNotesSignature = nacl.sign.detached(
    Utf8Codec.encode(publicNotes),
    issuerConfig.signer.secretKey,
  );

  return {
    human_id: humanId,
    content: Base64Codec.encode(content),

    public_notes: publicNotes,
    public_notes_signature: Base64Codec.encode(publicNotesSignature),

    broader_signature: Base64Codec.encode(
      nacl.sign.detached(
        Uint8Array.from([...publicNotesSignature, ...content]),
        issuerConfig.signer.secretKey,
      ),
    ),

    issuer: Base64Codec.encode(issuerConfig.signer.publicKey),
    encryption_public_key: Base64Codec.encode(issuerConfig.encrypter.publicKey),
  };
};

// Base interface for credential parameters
interface BaseCredentialParams extends Omit<idOSCredential, "id" | "original_id"> {
  id?: string;
}

interface HasUserEncryptionPublicKey {
  userEncryptionPublicKey: string;
}

interface CreateCredentialPermissionedParams
  extends BaseCredentialParams,
    HasUserEncryptionPublicKey {}

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

type BaseCredentialParams2 = {
  id?: string;
  humanId: string;
  publicNotes: string;
  plaintextContent: Uint8Array;
  receiverEncryptionPublicKey: Uint8Array;
};

export async function createCredentialPermissioned2(
  issuer_config: IssuerConfig2,
  params: BaseCredentialParams2,
): Promise<idOSCredential2> {
  const { dbid, kwilClient, kwilSigner } = issuer_config;
  const payload = ensureEntityId(buildInsertableIdosCredential2(issuer_config, params));

  await kwilClient.execute(
    {
      name: "upsert_credential_as_inserter2",
      dbid,
      inputs: [createActionInput(payload)],
    },
    kwilSigner,
    true,
  );

  return {
    ...payload,
    original_id: "",
  };
}

interface CreateCredentialByGrantParams extends BaseCredentialParams, HasUserEncryptionPublicKey {}

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
  issuer_config: IssuerConfig2,
  params: BaseCredentialParams2,
): Promise<idOSCredential2> {
  const { dbid, kwilClient, kwilSigner } = issuer_config;
  const payload = ensureEntityId(buildInsertableIdosCredential2(issuer_config, params));

  await kwilClient.execute(
    {
      name: "add_credential_by_write_grant2",
      dbid,
      inputs: [createActionInput(payload)],
    },
    kwilSigner,
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

type ShareCredentialByGrantParams2 = BaseCredentialParams2 & {
  grantee: string;
  lockedUntil: number;
  originalCredentialId: string;
};
export async function shareCredentialByGrant2(
  issuer_config: IssuerConfig2,
  params: ShareCredentialByGrantParams2,
): Promise<idOSCredential2> {
  const { dbid, kwilClient, kwilSigner } = issuer_config;
  const extraEntries = {
    grantee: params.grantee,
    locked_until: params.lockedUntil,
    original_credential_id: params.originalCredentialId,
  };
  const payload = {
    ...ensureEntityId(buildInsertableIdosCredential2(issuer_config, params)),
    ...extraEntries,
  };

  if (payload.public_notes !== "")
    throw new Error("shared credentials cannot have public_notes, it must be an empty string");

  await kwilClient.execute(
    {
      name: "share_credential_by_write_grant2",
      dbid,
      inputs: [createActionInput(payload)],
    },
    kwilSigner,
    true,
  );
  return {
    ...omit(payload, Object.keys(extraEntries) as (keyof typeof extraEntries)[]),
    original_id: payload.original_credential_id,
  };
}
