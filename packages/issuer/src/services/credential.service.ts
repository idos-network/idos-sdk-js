import type { idOSCredential, idOSCredentialRecord } from "@idos-network/credentials/types";
import type { KwilActionClient } from "@idos-network/kwil-infra";

import { buildSignedCredentialContentReference } from "@idos-network/credentials/utils";
import {
  type CreateCredentialsByDwgInput,
  createCredentialsByDwg,
  dwgMessage,
  type EditPublicNotesAsIssuerInput,
  editPublicNotesAsIssuer,
  getCredentialShared,
  getSiblingCredentialId,
  type idOSDelegatedWriteGrant,
} from "@idos-network/kwil-infra/actions";
import { BlobGateway, createBlobContentReference } from "@idos-network/utils/blob-gateway";
import { base64Encode, hexEncodeSha256Hash } from "@idos-network/utils/codecs";
import { encryptContent } from "@idos-network/utils/cryptography";
import invariant from "tiny-invariant";
import nacl from "tweetnacl";

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

export type CredentialByDelegatedWriteGrantBaseParams = Omit<DelegatedWriteGrantBaseParams, "id">;

type BuildPreliminaryIDOSCredentialArgs = Omit<BaseCredentialParams, "id" | "userId">;

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
  readonly #blobGateway: BlobGateway;

  constructor(
    kwilClient: KwilActionClient,
    signingKeyPair: nacl.SignKeyPair,
    blobGateway: BlobGateway,
  ) {
    this.#kwilClient = kwilClient;
    this.#signingKeyPair = signingKeyPair;
    this.#blobGateway = blobGateway;
  }

  #buildIDOSCredential(credential: PreliminaryIDOSCredential): Omit<idOSCredential, "user_id"> {
    return {
      id: credential.id,
      content_uri: credential.contentUri,
      content_size: credential.contentSize,
      public_notes: credential.publicNotes,
      issuer_auth_public_key: credential.issuerAuthPublicKey,
      encryptor_public_key: credential.encryptorPublicKey,
    };
  }

  async #buildPreliminaryIDOSCredential({
    publicNotes,
    plaintextContent,
    recipientEncryptionPublicKey,
  }: BuildPreliminaryIDOSCredentialArgs): Promise<Omit<PreliminaryIDOSCredential, "id">> {
    const ephemeralKeyPair = nacl.box.keyPair();
    const encryptedContent = encryptContent(
      plaintextContent,
      recipientEncryptionPublicKey,
      ephemeralKeyPair.secretKey,
    );
    const contentReference = await createBlobContentReference(encryptedContent);
    const signedReference = buildSignedCredentialContentReference(
      publicNotes,
      contentReference.uri,
      this.#signingKeyPair,
    );

    return {
      contentUri: contentReference.uri,
      contentSize: contentReference.size,
      encryptedContent,
      publicNotes,
      publicNotesSignature: signedReference.public_notes_signature,
      broaderSignature: signedReference.broader_signature,
      issuerAuthPublicKey: signedReference.issuer_auth_public_key,
      encryptorPublicKey: base64Encode(ephemeralKeyPair.publicKey),
    };
  }

  async requestDelegatedWriteGrantMessage(params: idOSDelegatedWriteGrant): Promise<string> {
    return dwgMessage(this.#kwilClient, params).then((res) => res.message);
  }

  async createCredentialByDelegatedWriteGrant(
    credentialParams: CredentialByDelegatedWriteGrantBaseParams,
    delegatedWriteGrant: DelegatedWriteGrantParams,
    consumerEncryptionPublicKey: Uint8Array,
  ): Promise<{
    originalCredential: Omit<idOSCredential, "user_id">;
    copyCredential: Omit<idOSCredential, "user_id">;
  }> {
    const originalCredential: PreliminaryIDOSCredential = {
      ...(await this.#buildPreliminaryIDOSCredential(credentialParams)),
      id: crypto.randomUUID(),
    };

    const contentHash = hexEncodeSha256Hash(credentialParams.plaintextContent);

    const copyCredential: PreliminaryIDOSCredential = {
      ...(await this.#buildPreliminaryIDOSCredential({
        publicNotes: "",
        plaintextContent: credentialParams.plaintextContent,
        recipientEncryptionPublicKey: consumerEncryptionPublicKey,
      })),
      id: crypto.randomUUID(),
    };

    const requestId = crypto.randomUUID();
    const payload: CreateCredentialsByDwgInput = {
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

    await createCredentialsByDwg(this.#kwilClient, payload);
    await this.#blobGateway.uploadCredentialBlobs({
      requestId,
      original: originalCredential.encryptedContent,
      copy: copyCredential.encryptedContent,
    });

    return {
      originalCredential: this.#buildIDOSCredential(originalCredential),
      copyCredential: this.#buildIDOSCredential(copyCredential),
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

  async getCredentialShared(id: string): Promise<idOSCredentialRecord | null> {
    const result = await getCredentialShared(this.#kwilClient, { id }).then((res) => res[0]);

    return result ?? null;
  }
}
