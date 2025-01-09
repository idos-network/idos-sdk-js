import { base64Decode, base64Encode, hexEncode, utf8Encode } from "@idos-network/codecs";
import type { idOSCredential, idOSGrant } from "@idos-network/idos-sdk-types";
import { omit } from "es-toolkit";
import { ethers } from "ethers";
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
  public_notes_signature: string;
  broader_signature: string;
};
const buildInsertableIDOSCredential = (
  issuerConfig: IssuerConfig,
  {
    userId,
    publicNotes,
    plaintextContent,
    receiverEncryptionPublicKey,
    senderSecretKey,
  }: {
    userId: string;
    publicNotes: string;
    plaintextContent: Uint8Array;
    receiverEncryptionPublicKey: Uint8Array;
    senderSecretKey?: Uint8Array;
  },
): InsertableIDOSCredential => {
  const keyPair = senderSecretKey
    ? nacl.box.keyPair.fromSecretKey(senderSecretKey)
    : nacl.box.keyPair();

  const content = base64Decode(
    encryptContent(plaintextContent, receiverEncryptionPublicKey, keyPair.secretKey),
  );

  const { public_notes, public_notes_signature } = buildUpdateablePublicNotes(issuerConfig, {
    publicNotes,
  });

  return {
    user_id: userId,
    content: base64Encode(content),

    public_notes,
    public_notes_signature,

    broader_signature: base64Encode(
      nacl.sign.detached(
        Uint8Array.from([...base64Decode(public_notes_signature), ...content]),
        issuerConfig.signingKeyPair.secretKey,
      ),
    ),

    issuer_auth_public_key: hexEncode(issuerConfig.signingKeyPair.publicKey, true),
    encryptor_public_key: base64Encode(keyPair.publicKey),
  };
};

type BaseCredentialParams = {
  id?: string;
  userId: string;
  publicNotes: string;
  plaintextContent: Uint8Array;
  receiverEncryptionPublicKey: Uint8Array;
  senderSecretKey?: Uint8Array;
};

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

const createIssuerCopy = async (issuerConfig: IssuerConfig, params: BaseCredentialParams) => {
  const issuerKeyPair = nacl.box.keyPair.fromSecretKey(
    base64Decode(issuerConfig.issuerEncryptionSecretKey!),
  );

  const receiverEncryptionPublicKey = issuerKeyPair.publicKey;
  const issuerWallet = new ethers.Wallet(issuerConfig.issuerWalletPrivateKey);

  await shareCredentialByGrant(issuerConfig, {
    ...params,
    originalCredentialId: params.id!,
    lockedUntil: 0,
    granteeAddress: issuerWallet.address,
    receiverEncryptionPublicKey,
    publicNotes: "",
    senderSecretKey: issuerKeyPair.secretKey,
  });
};

export const checkCredentialValidity = async (issuerConfig: IssuerConfig, grant: idOSGrant) => {
  return issuerConfig.sdk.checkCredentialValidity(grant);
};

export async function createCredentialByGrant(
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

  await createIssuerCopy(issuerConfig, {
    ...params,
    id: payload.id,
  });

  return {
    ...payload,
    original_id: "",
  };
}

export const findMatchingCredential = async (issuerConfig: IssuerConfig, credentialId: string) => {
  const { sdk } = issuerConfig;
  const grants = (await sdk.listGrants(1, 10)).grants || []; // @todo: replace with credential id
  const decryptedCredential = await sdk.getSharedCredentialContentDecrypted(
    grants[grants.length - 1].dataId || credentialId,
  );
  return decryptedCredential;
};

type ShareCredentialByGrantParams = BaseCredentialParams & {
  granteeAddress: string;
  lockedUntil: number;
  originalCredentialId: string;
  credentialHash?: string;
};
export async function shareCredentialByGrant(
  issuer_config: IssuerConfig,
  params: ShareCredentialByGrantParams,
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

type EditCredentialAsIssuerParams = {
  publicNotesId: string;
  publicNotes: string;
};
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
