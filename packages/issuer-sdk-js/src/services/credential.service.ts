import {
  type KwilActionClient,
  base64Decode,
  base64Encode,
  encryptContent,
  hexEncode,
  hexEncodeSha256Hash,
  utf8Encode,
} from "@idos-network/core";
import {
  type CreateCredentialByDelegatedWriteGrantParams,
  createCredentialByDelegatedWriteGrant as _createCredentialByDelegatedWriteGrant,
  editCredentialAsIssuer as _editCredentialAsIssuer,
  getCredentialIdByContentHash as _getCredentialIdByContentHash,
  getSharedCredential as _getSharedCredential,
} from "@idos-network/core/kwil-actions";
import type { idOSCredential } from "@idos-network/core/types";
import invariant from "tiny-invariant";
import nacl from "tweetnacl";

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

export class CredentialService {
  constructor(
    private readonly kwilClient: KwilActionClient,
    private readonly signingKeyPair: nacl.SignKeyPair,
    private readonly encryptionSecretKey: Uint8Array,
  ) {}

  private buildInsertableIDOSCredential(
    args: BuildInsertableIDOSCredentialArgs,
  ): InsertableIDOSCredential;
  private buildInsertableIDOSCredential(
    args: Omit<BuildInsertableIDOSCredentialArgs, "userId">,
  ): Omit<InsertableIDOSCredential, "user_id">;
  private buildInsertableIDOSCredential({
    userId,
    publicNotes,
    plaintextContent,
    recipientEncryptionPublicKey,
  }: Omit<BuildInsertableIDOSCredentialArgs, "userId"> & { userId?: string }):
    | InsertableIDOSCredential
    | Omit<InsertableIDOSCredential, "user_id"> {
    const ephemeralKeyPair = nacl.box.keyPair();
    const content = encryptContent(
      plaintextContent,
      recipientEncryptionPublicKey,
      ephemeralKeyPair.secretKey,
    );

    const public_notes_signature = base64Encode(
      nacl.sign.detached(utf8Encode(publicNotes), this.signingKeyPair.secretKey),
    );

    return {
      user_id: userId,
      content: base64Encode(content),
      public_notes: publicNotes,
      public_notes_signature,

      broader_signature: base64Encode(
        nacl.sign.detached(
          Uint8Array.from([...base64Decode(public_notes_signature), ...content]),
          this.signingKeyPair.secretKey,
        ),
      ),

      issuer_auth_public_key: hexEncode(this.signingKeyPair.publicKey, true),
      encryptor_public_key: base64Encode(ephemeralKeyPair.publicKey),
    };
  }

  private ensureEntityId<T extends { id?: string }>(entity: T): T & { id: string } {
    if (!entity.id) {
      (entity as T & { id: string }).id = crypto.randomUUID();
    }
    return entity as T & { id: string };
  }

  async createCredentialByDelegatedWriteGrant(
    credentialParams: DelegatedWriteGrantBaseParams,
    delegatedWriteGrant: DelegatedWriteGrantParams,
    consumerEncryptionPublicKey?: Uint8Array,
  ): Promise<{
    originalCredential: Omit<idOSCredential, "user_id">;
    copyCredential: Omit<idOSCredential, "user_id">;
  }> {
    let recipientPublicKey = consumerEncryptionPublicKey;
    if (!recipientPublicKey) {
      // If we're not explicitly given a consumer enc pub key, we're assuming that the issuer is creating a copy
      // for themselves. So, we derive the recipient encryption public key from the issuer's encryption secret key.
      recipientPublicKey = nacl.box.keyPair.fromSecretKey(this.encryptionSecretKey).publicKey;
    }

    const originalCredential = this.ensureEntityId(
      this.buildInsertableIDOSCredential(credentialParams),
    );

    const contentHash = hexEncodeSha256Hash(credentialParams.plaintextContent);

    const copyCredential = this.ensureEntityId(
      this.buildInsertableIDOSCredential({
        publicNotes: "",
        plaintextContent: credentialParams.plaintextContent,
        recipientEncryptionPublicKey: recipientPublicKey,
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

    await _createCredentialByDelegatedWriteGrant(this.kwilClient, payload);

    return { originalCredential, copyCredential };
  }

  async editCredentialAsIssuer(publicNotesId: string, publicNotes: string) {
    const payload = {
      public_notes_id: publicNotesId,
      public_notes: publicNotes,
    };

    const result = await _editCredentialAsIssuer(this.kwilClient, payload);
    return result ?? null;
  }

  async getCredentialIdByContentHash(contentHash: string): Promise<string | null> {
    const id = await _getCredentialIdByContentHash(this.kwilClient, contentHash);
    invariant(id, "Required `idOSCredential` id not found");
    return id;
  }

  async getSharedCredential(id: string) {
    const result = await _getSharedCredential(this.kwilClient, id);
    return result ?? null;
  }
}
