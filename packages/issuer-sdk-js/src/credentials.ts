import {
  base64Decode,
  base64Encode,
  hexEncode,
  hexEncodeSha256Hash,
  utf8Encode,
} from "@idos-network/codecs";
import type { idOSCredential } from "@idos-network/idos-sdk-types";
import { omit } from "es-toolkit";
import nacl from "tweetnacl";
import type { IssuerConfig } from "./create-issuer-config";
import { createActionInput, encryptContent, ensureEntityId } from "./internal";

type UpdateablePublicNotes = {
  publicNotes: string;
};
const buildUpdateablePublicNotes = (
  issuerConfig: IssuerConfig,
  { publicNotes }: UpdateablePublicNotes,
) => {
  const publicNotesSignature = nacl.sign.detached(
    utf8Encode(publicNotes),
    issuerConfig.signingKeyPair.secretKey,
  );

  return {
    public_notes: publicNotes,
    public_notes_signature: base64Encode(publicNotesSignature),
  };
};

type InsertableIDOSCredential = Omit<idOSCredential, "id" | "original_id"> & {
  id?: idOSCredential["id"];
  content_hash?: string;
  public_notes_signature: string;
  broader_signature: string;
};
const buildInsertableIDOSCredential = (
  issuerConfig: IssuerConfig,
  {
    userId,
    publicNotes,
    plaintextContent,
    recipientEncryptionPublicKey,
    contentHash,
  }: {
    userId: string;
    publicNotes: string;
    plaintextContent: Uint8Array;
    recipientEncryptionPublicKey: Uint8Array;
    contentHash?: string;
  },
): InsertableIDOSCredential => {
  const ephemeralKeyPair = nacl.box.keyPair();
  const content = encryptContent(
    plaintextContent,
    recipientEncryptionPublicKey,
    ephemeralKeyPair.secretKey,
  );

  const { public_notes, public_notes_signature } = buildUpdateablePublicNotes(issuerConfig, {
    publicNotes,
  });

  return {
    user_id: userId,
    content: base64Encode(content),
    content_hash: contentHash,
    public_notes,
    public_notes_signature,

    broader_signature: base64Encode(
      nacl.sign.detached(
        Uint8Array.from([...base64Decode(public_notes_signature), ...content]),
        issuerConfig.signingKeyPair.secretKey,
      ),
    ),

    issuer_auth_public_key: hexEncode(issuerConfig.signingKeyPair.publicKey, true),
    encryptor_public_key: base64Encode(ephemeralKeyPair.publicKey),
  };
};

interface BaseCredentialParams {
  id?: string;
  userId: string;
  publicNotes: string;
  plaintextContent: Uint8Array;
  recipientEncryptionPublicKey: Uint8Array;
}

export async function createCredentialPermissioned(
  issuerConfig: IssuerConfig,
  params: BaseCredentialParams,
): Promise<idOSCredential> {
  const { dbid, kwilClient, kwilSigner } = issuerConfig;
  const payload = ensureEntityId(buildInsertableIDOSCredential(issuerConfig, params));

  await kwilClient.execute(
    {
      name: "upsert_credential_as_inserter",
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

export async function createCredentialByWriteGrant(
  issuerConfig: IssuerConfig,
  params: BaseCredentialParams,
): Promise<idOSCredential> {
  const { dbid, kwilClient, kwilSigner } = issuerConfig;
  const payload = ensureEntityId(buildInsertableIDOSCredential(issuerConfig, params));

  await kwilClient.execute(
    {
      name: "add_credential_by_write_grant",
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

interface ShareCredentialByWriteGrantParams extends BaseCredentialParams {
  granteeAddress: string;
  lockedUntil: number;
  originalCredentialId: string;
  contentHash: string;
}
export async function shareCredentialByWriteGrant(
  issuer_config: IssuerConfig,
  params: ShareCredentialByWriteGrantParams,
): Promise<idOSCredential> {
  const { dbid, kwilClient, kwilSigner } = issuer_config;
  const extraEntries = {
    grantee_wallet_identifier: params.granteeAddress,
    locked_until: params.lockedUntil,
    original_credential_id: params.originalCredentialId,
  };
  const payload = {
    ...ensureEntityId(buildInsertableIDOSCredential(issuer_config, params)),
    ...extraEntries,
  };

  if (payload.public_notes !== "")
    throw new Error("shared credentials cannot have public_notes, it must be an empty string");

  if (!params.granteeAddress) throw new Error("`granteeAddress` is required");

  await kwilClient.execute(
    {
      name: "share_credential_by_write_grant",
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

interface EditCredentialAsIssuerParams {
  publicNotesId: string;
  publicNotes: string;
}
export async function editCredential(
  issuerConfig: IssuerConfig,
  { publicNotesId, publicNotes }: EditCredentialAsIssuerParams,
) {
  const { dbid, kwilClient, kwilSigner } = issuerConfig;
  const payload = {
    public_notes_id: publicNotesId,
    public_notes: publicNotes,
  };

  const result = await kwilClient.execute(
    {
      name: "edit_public_notes_as_issuer",
      dbid,
      inputs: [createActionInput(payload)],
    },
    kwilSigner,
    true,
  );

  return result;
}

interface CreateReusableCredentialParams extends BaseCredentialParams {
  granteeAddress: string;
}
export async function createReusableCredential(
  issuerConfig: IssuerConfig,
  params: CreateReusableCredentialParams,
) {
  const content = params.plaintextContent;

  // Create a credential for the given `recipientEncryptionPublicKey`.
  const credentialForReceiver = await createCredentialByWriteGrant(issuerConfig, params);

  // Calculate the hash of the `content` field of the params.
  // This is used to pass the `hash` field when sharing a credential by write grant.
  const contentHash = hexEncodeSha256Hash(content);

  // Derive the recipient encryption public key from the issuer's encryption secret key to use it as the recipient encryption public key.
  const recipientEncryptionPublicKey = nacl.box.keyPair.fromSecretKey(
    issuerConfig.encryptionSecretKey,
  ).publicKey;

  // Create a credential for the issuer itself.
  await shareCredentialByWriteGrant(issuerConfig, {
    ...params,
    publicNotes: "",
    recipientEncryptionPublicKey,
    lockedUntil: Math.floor(Date.now() / 1000) + 10,
    originalCredentialId: credentialForReceiver.id,
    contentHash,
  });

  return credentialForReceiver;
}

export async function getCredentialIdByContentHash(
  issuerConfig: IssuerConfig,
  contentHash: string,
): Promise<string | null> {
  const { dbid, kwilClient, kwilSigner } = issuerConfig;

  const response = (await kwilClient.call(
    {
      name: "get_sibling_credential_id",
      dbid,
      inputs: [createActionInput({ content_hash: contentHash })],
    },
    kwilSigner,
  )) as unknown as { data: { result: [{ id: string }] } };

  return response.data?.result?.[0]?.id ?? null;
}

export async function getSharedCredential(issuerConfig: IssuerConfig, id: string) {
  const { dbid, kwilClient, kwilSigner } = issuerConfig;

  const response = await kwilClient.call(
    {
      name: "get_credential_shared",
      dbid,
      inputs: [createActionInput({ id })],
    },
    kwilSigner,
  );

  return response?.data?.result?.[0] as unknown as idOSCredential | null;
}
