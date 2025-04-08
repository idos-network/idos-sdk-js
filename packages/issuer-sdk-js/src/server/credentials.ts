import {
  base64Decode,
  base64Encode,
  encryptContent,
  hexEncode,
  hexEncodeSha256Hash,
  type idOSCredential,
  utf8Encode,
} from "@idos-network/core";
import {
  type CreateCredentialByDelegatedWriteGrantParams,
  createCredentialByDelegatedWriteGrant as _createCredentialByDelegatedWriteGrant,
  editCredentialAsIssuer as _editCredentialAsIssuer,
  getCredentialIdByContentHash as _getCredentialIdByContentHash,
  getSharedCredential as _getSharedCredential,
} from "@idos-network/core/kwil-actions";
import invariant from "tiny-invariant";
import nacl from "tweetnacl";
import { ensureEntityId } from "../utils";
import type { IssuerServerConfig } from "./create-issuer-server-config";

type InsertableIDOSCredential = Omit<idOSCredential, "id" | "original_id"> & {
  id?: idOSCredential["id"];
  content_hash?: string;
  public_notes_signature: string;
  broader_signature: string;
};

type BuildInsertableIDOSCredentialArgs = {
  userId: string;
  publicNotes: string;
  plaintextContent: Uint8Array;
  recipientEncryptionPublicKey: Uint8Array;
};

function buildInsertableIDOSCredential(
  issuerConfig: IssuerServerConfig,
  args: BuildInsertableIDOSCredentialArgs,
): InsertableIDOSCredential;
function buildInsertableIDOSCredential(
  issuerConfig: IssuerServerConfig,
  args: Omit<BuildInsertableIDOSCredentialArgs, "userId">,
): Omit<InsertableIDOSCredential, "user_id">;
function buildInsertableIDOSCredential(
  issuerConfig: IssuerServerConfig,
  {
    userId,
    publicNotes,
    plaintextContent,
    recipientEncryptionPublicKey,
  }: Omit<BuildInsertableIDOSCredentialArgs, "userId"> & { userId?: string },
): InsertableIDOSCredential | Omit<InsertableIDOSCredential, "user_id"> {
  const ephemeralKeyPair = nacl.box.keyPair();
  const content = encryptContent(
    plaintextContent,
    recipientEncryptionPublicKey,
    ephemeralKeyPair.secretKey,
  );

  const public_notes_signature = base64Encode(
    nacl.sign.detached(utf8Encode(publicNotes), issuerConfig.signingKeyPair.secretKey),
  );

  return {
    user_id: userId,
    content: base64Encode(content),
    public_notes: publicNotes,
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
}

export interface BaseCredentialParams {
  id?: string;
  userId: string;
  publicNotes: string;
  plaintextContent: Uint8Array;
  recipientEncryptionPublicKey: Uint8Array;
}

export type DelegatedWriteGrantBaseParams = Omit<BaseCredentialParams, "userId">;

export interface DelegatedWriteGrantParams {
  id: string;
  ownerWalletIdentifier: string;
  consumerWalletIdentifier: string;
  issuerPublicKey: string;
  accessGrantTimelock: string;
  notUsableBefore: string;
  notUsableAfter: string;
  signature: string;
}

export async function createCredentialByDelegatedWriteGrant(
  issuerConfig: IssuerServerConfig,
  credentialParams: DelegatedWriteGrantBaseParams,
  delegatedWriteGrant: DelegatedWriteGrantParams,
  consumerEncryptionPublicKey?: Uint8Array,
): Promise<{
  originalCredential: Omit<idOSCredential, "user_id">;
  copyCredential: Omit<idOSCredential, "user_id">;
}> {
  const { kwilClient, encryptionSecretKey } = issuerConfig;
  if (!consumerEncryptionPublicKey) {
    // If we're not explicitly given a consumer enc pub key, we're assuming that the issuer is creating a copy
    // for themselves. So, we derive the recipient encryption public key from the issuer's encryption secret key.
    // biome-ignore lint/style/noParameterAssign:
    consumerEncryptionPublicKey = nacl.box.keyPair.fromSecretKey(encryptionSecretKey).publicKey;
  }
  const originalCredential = ensureEntityId(
    buildInsertableIDOSCredential(issuerConfig, credentialParams),
  );
  const contentHash = hexEncodeSha256Hash(credentialParams.plaintextContent);
  const copyCredential = ensureEntityId(
    buildInsertableIDOSCredential(issuerConfig, {
      publicNotes: "",
      plaintextContent: credentialParams.plaintextContent,
      recipientEncryptionPublicKey: consumerEncryptionPublicKey,
    }),
  );
  const payload: CreateCredentialByDelegatedWriteGrantParams = {
    issuer_auth_public_key: originalCredential.issuer_auth_public_key,
    original_encryptor_public_key: originalCredential.encryptor_public_key,
    original_credential_id: originalCredential.id,
    original_content: originalCredential.content,
    original_public_notes: originalCredential.public_notes,
    original_public_notes_signature: originalCredential.public_notes_signature,
    original_broader_signature: originalCredential.broader_signature,
    copy_encryptor_public_key: copyCredential.encryptor_public_key,
    copy_credential_id: copyCredential.id,
    copy_content: copyCredential.content,
    copy_public_notes_signature: copyCredential.public_notes_signature,
    copy_broader_signature: copyCredential.broader_signature,
    content_hash: contentHash,
    dwg_owner: delegatedWriteGrant.ownerWalletIdentifier,
    dwg_grantee: delegatedWriteGrant.consumerWalletIdentifier,
    dwg_issuer_public_key: delegatedWriteGrant.issuerPublicKey,
    dwg_id: delegatedWriteGrant.id,
    dwg_access_grant_timelock: delegatedWriteGrant.accessGrantTimelock,
    dwg_not_before: delegatedWriteGrant.notUsableBefore,
    dwg_not_after: delegatedWriteGrant.notUsableAfter,
    dwg_signature: delegatedWriteGrant.signature,
  };

  await _createCredentialByDelegatedWriteGrant(kwilClient, payload);

  return { originalCredential, copyCredential };
}

interface EditCredentialAsIssuerParams {
  publicNotesId: string;
  publicNotes: string;
}
export async function editCredentialAsIssuer(
  issuerConfig: IssuerServerConfig,
  { publicNotesId, publicNotes }: EditCredentialAsIssuerParams,
) {
  const { kwilClient } = issuerConfig;
  const payload = {
    public_notes_id: publicNotesId,
    public_notes: publicNotes,
  };

  const result = await _editCredentialAsIssuer(kwilClient, payload);

  return result ?? null;
}

export async function getCredentialIdByContentHash(
  issuerConfig: IssuerServerConfig,
  contentHash: string,
): Promise<string | null> {
  const { kwilClient } = issuerConfig;

  const id = await _getCredentialIdByContentHash(kwilClient, contentHash);
  invariant(id, "Required `idOSCredential` id not found");

  return id;
}

export async function getSharedCredential(issuerConfig: IssuerServerConfig, id: string) {
  const { kwilClient } = issuerConfig;

  const result = await _getSharedCredential(kwilClient, id);

  return result ?? null;
}
