import {
  base64Decode,
  base64Encode,
  hexEncode,
  hexEncodeSha256Hash,
  sha256Hash,
  utf8Decode,
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
  const content = base64Decode(
    encryptContent(plaintextContent, recipientEncryptionPublicKey, ephemeralKeyPair.secretKey),
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

export const insertGrantForEntity = async () => {
  // @todo: if grant hash provided by an entity is valid, insert it into idOS grant table
  throw new Error("Not implemented yet");
};

const getCredentialByGrantId = async (
  issuerConfig: IssuerConfig,
  grantId: string,
): Promise<idOSCredential> => {
  const { kwilClient, dbid, kwilSigner } = issuerConfig;

  const [relatedCredential] = (await kwilClient.call(
    {
      name: "get_credential_shared",
      dbid,
      inputs: [
        createActionInput({
          id: grantId,
        }),
      ],
    },
    kwilSigner,
  )) as unknown as idOSCredential[];
  return relatedCredential;
};

const hashCredentialContent = (credentialContent: string) => {
  const encodedContent = new TextEncoder().encode(credentialContent);
  return hexEncode(sha256Hash(encodedContent), true);
};

const decryptContent = (
  fullMessage: Uint8Array,
  senderPublicKey: Uint8Array,
  secretKey: Uint8Array,
) => {
  const nonce = fullMessage.slice(0, nacl.box.nonceLength);
  const message = fullMessage.slice(nacl.box.nonceLength, fullMessage.length);
  const decrypted = nacl.box.open(message, nonce, senderPublicKey, secretKey);

  if (decrypted === null) {
    throw Error(
      `Couldn't decrypt. ${JSON.stringify(
        {
          fullMessage: base64Encode(fullMessage),
          message: base64Encode(message),
          nonce: base64Encode(nonce),
          senderPublicKey: base64Encode(senderPublicKey),
        },
        null,
        2,
      )}`,
    );
  }

  return decrypted;
};

export const checkGrantValidity = async (
  issuerConfig: IssuerConfig,
  grantDataId: string,
  grantHash: string,
) => {
  const credential = await getCredentialByGrantId(issuerConfig, grantDataId);
  // fetch credential original content
  const decryptedContent = utf8Decode(
    decryptContent(
      base64Decode(credential.content),
      base64Decode(credential.encryptor_public_key),
      issuerConfig.encryptionSecretKey,
    ),
  );
  const hashedContent = hashCredentialContent(decryptedContent as string);
  return hashedContent === grantHash;
};

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
    recipientEncryptionPublicKey,
    lockedUntil: 0,
    originalCredentialId: credentialForReceiver.id,
    contentHash,
  });

  return credentialForReceiver;
}
