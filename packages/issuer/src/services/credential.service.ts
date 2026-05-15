import type { idOSCredential, idOSCredential2 } from "@idos-network/credentials/types";
import type { KwilActionClient } from "@idos-network/kwil-infra";

import {
  type CreateCredentialsByDwgInput,
  type CreatePreliminaryCredentialsByDwgInput,
  createCredentialsByDwg,
  createPreliminaryCredentialsByDwg,
  dwgMessage,
  type EditPublicNotesAsIssuerInput,
  editPublicNotesAsIssuer,
  getCredentialShared,
  getSiblingCredentialId,
  type idOSDelegatedWriteGrant,
} from "@idos-network/kwil-infra/actions";
import { BlobGateway, createBlobContentReference } from "@idos-network/utils/blob-gateway";
import {
  base64Decode,
  base64Encode,
  hexEncode,
  hexEncodeSha256Hash,
  utf8Encode,
} from "@idos-network/utils/codecs";
import { encryptContent } from "@idos-network/utils/cryptography";
import invariant from "tiny-invariant";
import nacl from "tweetnacl";

type InsertableIDOSCredential = Omit<
  idOSCredential,
  "id" | "original_id" | "content" | "content_uri" | "content_size"
> & {
  id?: idOSCredential["id"];
  content: string;
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

export type BaseCredentialParams = {
  id?: string;
  userId: string;
  publicNotes: string;
  plaintextContent: Uint8Array;
  recipientEncryptionPublicKey: Uint8Array;
};

export type DelegatedWriteGrantBaseParams = Omit<BaseCredentialParams, "userId">;

export type DelegatedWriteGrantParams = {
  id: string;
  ownerWalletIdentifier: string;
  consumerWalletIdentifier: string;
  issuerPublicKey: string;
  accessGrantTimelock: string;
  notUsableBefore: string;
  notUsableAfter: string;
  signature: string;
};

export type CredentialByDelegatedWriteGrant2BaseParams = Omit<DelegatedWriteGrantBaseParams, "id">;

type PreliminaryIDOSCredential = {
  id: string;
  contentUri: string;
  contentSize: number;
  encryptedContent: Uint8Array;
  publicNotes: string;
  publicNotesSignature: string;
  broaderSignature: string;
  issuerAuthPublicKey: string;
  encryptorPublicKey: string;
};

export class CredentialService {
  readonly #kwilClient: KwilActionClient;
  readonly #signingKeyPair: nacl.SignKeyPair;
  readonly #encryptionSecretKey: Uint8Array;
  readonly #blobGateway: BlobGateway;

  constructor(
    kwilClient: KwilActionClient,
    signingKeyPair: nacl.SignKeyPair,
    encryptionSecretKey: Uint8Array,
    blobGateway: BlobGateway,
  ) {
    this.#kwilClient = kwilClient;
    this.#signingKeyPair = signingKeyPair;
    this.#encryptionSecretKey = encryptionSecretKey;
    this.#blobGateway = blobGateway;
  }

  #buildInsertableIDOSCredential({
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
      nacl.sign.detached(utf8Encode(publicNotes), this.#signingKeyPair.secretKey),
    );

    return {
      user_id: userId,
      content: base64Encode(content),
      public_notes: publicNotes,
      public_notes_signature,

      broader_signature: base64Encode(
        nacl.sign.detached(
          Uint8Array.from([...base64Decode(public_notes_signature), ...content]),
          this.#signingKeyPair.secretKey,
        ),
      ),

      issuer_auth_public_key: hexEncode(this.#signingKeyPair.publicKey, true),
      encryptor_public_key: base64Encode(ephemeralKeyPair.publicKey),
    };
  }

  #ensureEntityId<T extends { id?: string }>(entity: T): T & { id: string } {
    if (!entity.id) {
      (entity as T & { id: string }).id = crypto.randomUUID();
    }
    return entity as T & { id: string };
  }

  #buildIDOSCredential2(credential: PreliminaryIDOSCredential): Omit<idOSCredential2, "user_id"> {
    return {
      id: credential.id,
      content_uri: credential.contentUri,
      content_size: credential.contentSize,
      public_notes: credential.publicNotes,
      issuer_auth_public_key: credential.issuerAuthPublicKey,
      encryptor_public_key: credential.encryptorPublicKey,
    };
  }

  async #buildInsertableIDOSCredential2({
    publicNotes,
    plaintextContent,
    recipientEncryptionPublicKey,
  }: Omit<BuildInsertableIDOSCredentialArgs, "userId">): Promise<
    Omit<PreliminaryIDOSCredential, "id">
  > {
    const ephemeralKeyPair = nacl.box.keyPair();
    const encryptedContent = encryptContent(
      plaintextContent,
      recipientEncryptionPublicKey,
      ephemeralKeyPair.secretKey,
    );
    const contentReference = await createBlobContentReference(encryptedContent);

    const publicNotesSignature = base64Encode(
      nacl.sign.detached(utf8Encode(publicNotes), this.#signingKeyPair.secretKey),
    );

    return {
      contentUri: contentReference.uri,
      contentSize: contentReference.size,
      encryptedContent,
      publicNotes,
      publicNotesSignature,

      broaderSignature: base64Encode(
        nacl.sign.detached(
          Uint8Array.from([
            ...base64Decode(publicNotesSignature),
            ...utf8Encode(contentReference.uri),
          ]),
          this.#signingKeyPair.secretKey,
        ),
      ),

      issuerAuthPublicKey: hexEncode(this.#signingKeyPair.publicKey, true),
      encryptorPublicKey: base64Encode(ephemeralKeyPair.publicKey),
    };
  }

  async requestDelegatedWriteGrantMessage(params: idOSDelegatedWriteGrant): Promise<string> {
    return dwgMessage(this.#kwilClient, params).then((res) => res.message);
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
      recipientPublicKey = nacl.box.keyPair.fromSecretKey(this.#encryptionSecretKey).publicKey;
    }

    const originalCredential = this.#ensureEntityId(
      this.#buildInsertableIDOSCredential(credentialParams),
    );

    const contentHash = hexEncodeSha256Hash(credentialParams.plaintextContent);

    const copyCredential = this.#ensureEntityId(
      this.#buildInsertableIDOSCredential({
        publicNotes: "",
        plaintextContent: credentialParams.plaintextContent,
        recipientEncryptionPublicKey: recipientPublicKey,
      }),
    );

    const payload: CreateCredentialsByDwgInput = {
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

    await createCredentialsByDwg(this.#kwilClient, payload);

    return { originalCredential, copyCredential };
  }

  async createCredentialByDelegatedWriteGrant2(
    credentialParams: CredentialByDelegatedWriteGrant2BaseParams,
    delegatedWriteGrant: DelegatedWriteGrantParams,
    consumerEncryptionPublicKey: Uint8Array,
  ): Promise<{
    originalCredential: Omit<idOSCredential2, "user_id">;
    copyCredential: Omit<idOSCredential2, "user_id">;
  }> {
    const originalCredential: PreliminaryIDOSCredential = {
      ...(await this.#buildInsertableIDOSCredential2(credentialParams)),
      id: crypto.randomUUID(),
    };

    const contentHash = hexEncodeSha256Hash(credentialParams.plaintextContent);

    const copyCredential: PreliminaryIDOSCredential = {
      ...(await this.#buildInsertableIDOSCredential2({
        publicNotes: "",
        plaintextContent: credentialParams.plaintextContent,
        recipientEncryptionPublicKey: consumerEncryptionPublicKey,
      })),
      id: crypto.randomUUID(),
    };

    const requestId = crypto.randomUUID();
    const payload: CreatePreliminaryCredentialsByDwgInput = {
      request_id: requestId,
      issuer_auth_public_key: originalCredential.issuerAuthPublicKey,
      original_encryptor_public_key: originalCredential.encryptorPublicKey,
      original_id: originalCredential.id,
      original_content_uri: originalCredential.contentUri,
      original_content_size: originalCredential.contentSize,
      original_public_notes: originalCredential.publicNotes,
      original_public_notes_signature: originalCredential.publicNotesSignature,
      original_broader_signature: originalCredential.broaderSignature,
      copy_encryptor_public_key: copyCredential.encryptorPublicKey,
      copy_id: copyCredential.id,
      copy_content_uri: copyCredential.contentUri,
      copy_content_size: copyCredential.contentSize,
      copy_public_notes_signature: copyCredential.publicNotesSignature,
      copy_broader_signature: copyCredential.broaderSignature,
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

    console.log("create_preliminary_credentials_by_dwg payload");
    console.log(JSON.stringify(payload, null, 2));

    await createPreliminaryCredentialsByDwg(this.#kwilClient, payload);
    await this.#blobGateway.uploadCredentialBlobs({
      requestId,
      original: originalCredential.encryptedContent,
      copy: copyCredential.encryptedContent,
    });

    return {
      originalCredential: this.#buildIDOSCredential2(originalCredential),
      copyCredential: this.#buildIDOSCredential2(copyCredential),
    };
  }

  async editCredentialAsIssuer(
    publicNotesId: string,
    publicNotes: string,
  ): Promise<EditPublicNotesAsIssuerInput | null> {
    const payload = {
      public_notes_id: publicNotesId,
      public_notes: publicNotes,
    };

    await editPublicNotesAsIssuer(this.#kwilClient, payload);

    return payload;
  }

  async getCredentialIdByContentHash(contentHash: string): Promise<string | null> {
    const id = await getSiblingCredentialId(this.#kwilClient, { content_hash: contentHash }).then(
      (res) => res.id,
    );

    invariant(id, "Required `idOSCredential` id not found");

    return id;
  }

  async getCredentialShared(id: string): Promise<idOSCredential | null> {
    const result = await getCredentialShared(this.#kwilClient, { id }).then((res) => res[0]);

    return result ?? null;
  }
}
