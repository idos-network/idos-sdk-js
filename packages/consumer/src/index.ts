import type { VerifyCredentialResult } from "@idos-network/credentials/builder";
import type {
  AvailableIssuerType,
  IDDocumentType,
  idOSCredential,
  VerifiableCredential,
  VerifiableCredentialSubject,
} from "@idos-network/credentials/types";
import type { KwilSigner } from "@idos-network/kwil-js";

import { type Credential, verifyCredential } from "@idos-network/credentials/builder";
import { normalizeCredentialContentSize } from "@idos-network/credentials/utils";
import {
  createKgwAuthenticatedBlobGateway,
  createNodeKwilClient,
  createServerKwilSigner,
  type KwilActionClient,
  type KwilSignerType,
} from "@idos-network/kwil-infra";
import {
  type CreateAgByDagForCopyInput,
  createAgByDagForCopy,
  type GetAccessGrantsGrantedInput,
  getAccessGrantsForCredential,
  getAccessGrantsGrantedCount,
  getCredentialShared,
  getCredentialsSharedByUser,
  getGrants,
  type idOSGrant,
  rescindSharedCredential,
} from "@idos-network/kwil-infra/actions";
import { BlobGateway } from "@idos-network/utils/blob-gateway";
import { base64Encode } from "@idos-network/utils/codecs";
import { NoncedBox } from "@idos-network/utils/cryptography";
import invariant from "tiny-invariant";

export type idOSConsumerConfig = {
  recipientEncryptionPrivateKey: string;
  nodeUrl?: string;
  chainId?: string;
  blobGatewayUrl?: string;
  consumerSigner: KwilSignerType;
};

export class idOSConsumer {
  readonly address: string;
  #kwilClient: KwilActionClient;
  #noncedBox: NoncedBox;
  #signer: KwilSigner;
  #blobGateway?: BlobGateway;

  static async init({
    recipientEncryptionPrivateKey,
    nodeUrl = "https://nodes.idos.network",
    chainId,
    blobGatewayUrl,
    consumerSigner,
  }: idOSConsumerConfig): Promise<idOSConsumer> {
    const kwilClient = await createNodeKwilClient({
      nodeUrl,
      chainId,
    });

    const [signer, address] = await createServerKwilSigner(consumerSigner);
    kwilClient.setSigner(signer);
    const blobGateway = blobGatewayUrl
      ? createKgwAuthenticatedBlobGateway({ url: blobGatewayUrl, kwilClient, signer })
      : undefined;

    return new idOSConsumer(
      NoncedBox.nonceFromBase64SecretKey(recipientEncryptionPrivateKey),
      kwilClient,
      address,
      signer,
      blobGateway,
    );
  }

  private constructor(
    noncedBox: NoncedBox,
    kwilClient: KwilActionClient,
    address: string,
    signer: KwilSigner,
    blobGateway?: BlobGateway,
  ) {
    this.#noncedBox = noncedBox;
    this.#kwilClient = kwilClient;
    this.address = address;
    this.#signer = signer;
    this.#blobGateway = blobGateway;
  }

  get signer(): KwilSigner {
    return this.#signer;
  }

  get encryptionPublicKey(): string {
    return base64Encode(this.#noncedBox.keyPair.publicKey);
  }

  async getCredentialSharedFromIDOS(dataId: string): Promise<idOSCredential | undefined> {
    return getCredentialShared(this.#kwilClient, { id: dataId }).then((res) => res[0]);
  }

  async getCredentialSharedContentDecrypted(dataId: string): Promise<string> {
    const credentialCopy = await this.getCredentialSharedFromIDOS(dataId);

    invariant(credentialCopy, `Credential with id ${dataId} not found`);

    return await this.#noncedBox.decrypt(
      await this.#getCredentialEncryptedContent(credentialCopy),
      credentialCopy.encryptor_public_key,
    );
  }

  async rescindSharedCredential(credentialId: string): Promise<void> {
    return rescindSharedCredential(this.#kwilClient, { credential_id: credentialId });
  }

  async getGrantsCount(userId: string | null = null): Promise<number> {
    return getAccessGrantsGrantedCount(this.#kwilClient, { user_id: userId ?? null }).then(
      (res) => res.count,
    );
  }

  async getAccessGrantsForCredential(credentialId: string): Promise<idOSGrant[]> {
    const params = { credential_id: credentialId };
    return getAccessGrantsForCredential(this.#kwilClient, params);
  }

  async getCredentialsSharedByUser(
    userId: string,
    original_issuer_auth_public_key: string | null = null,
  ): Promise<Omit<idOSCredential, "content">[]> {
    return getCredentialsSharedByUser(this.#kwilClient, {
      user_id: userId,
      original_issuer_auth_public_key,
    });
  }

  async getAccessGrants(params: Partial<GetAccessGrantsGrantedInput>): Promise<{
    grants: idOSGrant[];
    totalCount: number;
  }> {
    return {
      grants: await getGrants(this.#kwilClient, params),
      totalCount: await this.getGrantsCount(params.user_id ?? null),
    };
  }

  async createAccessGrantByDag(
    params: CreateAgByDagForCopyInput,
  ): Promise<CreateAgByDagForCopyInput> {
    await createAgByDagForCopy(this.#kwilClient, params);
    return params;
  }

  async verifyCredential<K = VerifiableCredentialSubject>(
    credentials: VerifiableCredential<K>,
    issuers: AvailableIssuerType[],
  ): Promise<VerifyCredentialResult> {
    return verifyCredential<K>(credentials, issuers);
  }

  async #getCredentialEncryptedContent(credential: idOSCredential): Promise<string> {
    if (credential.content) {
      return credential.content;
    }

    invariant(credential.content_uri, `Credential with id ${credential.id} has no content_uri`);
    invariant(
      this.#blobGateway,
      `Credential with id ${credential.id} is blob-backed, but blobGatewayUrl was not configured`,
    );

    const expectedContentSize = normalizeCredentialContentSize(credential.content_size);
    const content = await this.#blobGateway.fetchBlob({
      contentUri: credential.content_uri,
      expectedSize: expectedContentSize,
    });
    if (expectedContentSize !== undefined) {
      console.log("credential blob size check");
      console.log(
        JSON.stringify(
          {
            credential_id: credential.id,
            content_uri: credential.content_uri,
            content_size: credential.content_size,
            content_size_type: typeof credential.content_size,
            expected_content_size: expectedContentSize,
            fetched_byte_length: content.byteLength,
          },
          null,
          2,
        ),
      );
      invariant(
        content.byteLength === expectedContentSize,
        `Credential with id ${credential.id} blob size does not match content_size`,
      );
    }

    return base64Encode(content);
  }
}

export type {
  idOSCredential,
  idOSGrant,
  Credential,
  VerifiableCredential,
  VerifiableCredentialSubject,
  VerifyCredentialResult,
  AvailableIssuerType,
  IDDocumentType,
};
