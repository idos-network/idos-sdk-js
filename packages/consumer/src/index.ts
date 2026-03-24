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
import {
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
import { base64Encode } from "@idos-network/utils/codecs";
import { NoncedBox } from "@idos-network/utils/cryptography";
import invariant from "tiny-invariant";

export type idOSConsumerConfig = {
  recipientEncryptionPrivateKey: string;
  nodeUrl?: string;
  chainId?: string;
  consumerSigner: KwilSignerType;
};

export class idOSConsumer {
  readonly address: string;
  #kwilClient: KwilActionClient;
  #noncedBox: NoncedBox;
  #signer: KwilSigner;

  static async init({
    recipientEncryptionPrivateKey,
    nodeUrl = "https://nodes.idos.network",
    chainId,
    consumerSigner,
  }: idOSConsumerConfig): Promise<idOSConsumer> {
    const kwilClient = await createNodeKwilClient({
      nodeUrl,
      chainId,
    });

    const [signer, address] = await createServerKwilSigner(consumerSigner);
    kwilClient.setSigner(signer);

    return new idOSConsumer(
      NoncedBox.nonceFromBase64SecretKey(recipientEncryptionPrivateKey),
      kwilClient,
      address,
      signer,
    );
  }

  private constructor(
    noncedBox: NoncedBox,
    kwilClient: KwilActionClient,
    address: string,
    signer: KwilSigner,
  ) {
    this.#noncedBox = noncedBox;
    this.#kwilClient = kwilClient;
    this.address = address;
    this.#signer = signer;
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
      credentialCopy.content,
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
