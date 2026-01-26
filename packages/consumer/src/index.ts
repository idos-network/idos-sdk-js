import { NoncedBox } from "@idos-network/core/cryptography";
import {
  type CreateAgByDagForCopyInput,
  createAgByDagForCopy,
  type GetAccessGrantsGrantedInput,
  getAccessGrantsForCredential,
  getAccessGrantsGrantedCount,
  getCredentialShared,
  getCredentialsSharedByUser,
  getGrants,
  getPassportingPeers,
  type idOSGrant,
  type idOSPassportingPeer,
  rescindSharedCredential,
} from "@idos-network/core/kwil-actions";
import {
  createNodeKwilClient,
  createServerKwilSigner,
  type KwilActionClient,
  type KwilSignerType,
} from "@idos-network/core/kwil-infra";
import type { VerifyCredentialResult } from "@idos-network/credentials/builder";
import { type Credential, verifyCredential } from "@idos-network/credentials/builder";
import type {
  AvailableIssuerType,
  IDDocumentType,
  idOSCredential,
  VerifiableCredential,
  VerifiableCredentialSubject,
} from "@idos-network/credentials/types";
import type { KwilSigner } from "@idos-network/kwil-js";
import { base64Encode, hexEncodeSha256Hash, utf8Encode } from "@idos-network/utils/codecs";
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

    const [signer, address] = createServerKwilSigner(consumerSigner);
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

  async getReusableCredentialCompliantly(credentialId: string): Promise<idOSCredential> {
    const credential = await this.getCredentialSharedFromIDOS(credentialId);

    invariant(credential, `Credential with id ${credentialId} not found`);

    const accessGrants = await this.getAccessGrantsForCredential(credentialId);

    invariant(
      accessGrants.length > 0,
      `Access grants for credential with id ${credentialId} not found`,
    );

    // @todo Solve this, there can be more than 1 grant
    const accessGrant = accessGrants[0];

    // @todo: ensure the AG they used was inserted by a known OE. This will be done by querying the registry and matching the `inserter_id` in the AG with the id of the OE.
    const credentialContent = await this.#noncedBox.decrypt(
      credential.content,
      credential.encryptor_public_key,
    );

    const contentHash = hexEncodeSha256Hash(utf8Encode(credentialContent));

    if (contentHash !== accessGrant.content_hash) {
      throw new Error("Credential content hash does not match the access grant hash");
    }

    return credential;
  }

  async getAccessGrants(params: GetAccessGrantsGrantedInput): Promise<{
    grants: idOSGrant[];
    totalCount: number;
  }> {
    return {
      grants: await getGrants(this.#kwilClient, params),
      totalCount: await this.getGrantsCount(params.user_id),
    };
  }

  async createAccessGrantByDag(
    params: CreateAgByDagForCopyInput,
  ): Promise<CreateAgByDagForCopyInput> {
    await createAgByDagForCopy(this.#kwilClient, params);
    return params;
  }

  async getPassportingPeers(): Promise<idOSPassportingPeer[]> {
    return getPassportingPeers(this.#kwilClient);
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
