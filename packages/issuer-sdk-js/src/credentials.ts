import {
  base64Decode,
  base64Encode,
  hexEncode,
  sha256Hash,
  utf8Decode,
  utf8Encode,
} from "@idos-network/codecs";
import { encryptContent } from "@idos-network/cryptography";
import type { idOSCredential } from "@idos-network/idos-sdk-types";
import { omit } from "es-toolkit";
import { ethers } from "ethers";
import nacl from "tweetnacl";
import type { IssuerConfig } from "./create-issuer-config";
import { createActionInput, ensureEntityId } from "./internal";

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
  }: {
    userId: string;
    publicNotes: string;
    plaintextContent: Uint8Array;
    receiverEncryptionPublicKey: Uint8Array;
  },
): InsertableIDOSCredential => {
  const ephemeralKeyPair = nacl.box.keyPair();

  const content = encryptContent(
    plaintextContent,
    receiverEncryptionPublicKey,
    ephemeralKeyPair.secretKey,
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
    encryptor_public_key: base64Encode(ephemeralKeyPair.publicKey),
  };
};

type BaseCredentialParams = {
  id?: string;
  userId: string;
  publicNotes: string;
  plaintextContent: Uint8Array;
  receiverEncryptionPublicKey: Uint8Array;
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

export const createIssuerCopy = async (
  issuerConfig: IssuerConfig,
  params: BaseCredentialParams & { originalCredentialId: string },
) => {
  const issuerKeyPair = nacl.box.keyPair.fromSecretKey(
    base64Decode(issuerConfig.issuerEncryptionSecretKey),
  );
  const { issuerWalletPrivateKey } = issuerConfig;

  await shareCredentialByGrant(issuerConfig, {
    ...params,
    lockedUntil: 0,
    granteeAddress: new ethers.Wallet(issuerWalletPrivateKey).address,
    receiverEncryptionPublicKey: issuerKeyPair.publicKey,
    publicNotes: "",
  });
};

export const insertGrantForEntity = async () => {
  // @todo: if grant hash provided by an entity is valid, insert it into idOS grant table
  throw new Error("Not implemented yet");
};

const getCredentialByGrantId = async (
  issuerConfig: IssuerConfig,
  grantId: string,
): Promise<idOSCredential> => {
  const { kwilActions } = issuerConfig;
  const [relatedCredential] = await kwilActions.call<idOSCredential[]>({
    name: "get_credential_shared",
    inputs: {
      id: grantId,
    },
  });
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
      base64Decode(issuerConfig.issuerEncryptionSecretKey),
    ),
  );
  const hashedContent = hashCredentialContent(decryptedContent as string);
  return hashedContent === grantHash;
};

export async function createCredentialByGrant(
  issuerConfig: IssuerConfig,
  params: BaseCredentialParams,
): Promise<idOSCredential> {
  const { dbid, kwilClient, kwilSigner } = issuerConfig;
  const payload = ensureEntityId(buildInsertableIDOSCredential(issuerConfig, params));
  const issuerKeyPair = nacl.box.keyPair.fromSecretKey(
    base64Decode(issuerConfig.issuerEncryptionSecretKey),
  );
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
    originalCredentialId: payload.id,
    receiverEncryptionPublicKey: issuerKeyPair.secretKey,
  });

  return {
    ...payload,
    original_id: "",
  };
}

type ShareCredentialByGrantParams = BaseCredentialParams & {
  granteeAddress: string;
  lockedUntil: number;
  originalCredentialId: string;
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
