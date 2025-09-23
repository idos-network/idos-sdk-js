import { NoncedBox } from "@idos-network/core/cryptography";
import {
  type CreateAccessGrantByDagInput,
  createAccessGrantByDag,
  type GetGrantsPaginatedInput,
  getAccessGrantsForCredential,
  getCredentialsSharedByUser,
  getGrants,
  getGrantsCount,
  getPassportingPeers,
  getSharedCredential,
  type idOSGrant,
} from "@idos-network/core/kwil-actions";
import {
  createNodeKwilClient,
  createServerKwilSigner,
  type KwilActionClient,
  type KwilSignerType,
} from "@idos-network/core/kwil-infra";
import type { PassportingPeer } from "@idos-network/core/types";
import type { idOSCredential } from "@idos-network/credentials";
import {
  type AvailableIssuerType,
  type Credential,
  type IDDocumentType,
  type VerifiableCredential,
  type VerifiableCredentialSubject,
  type VerifyCredentialResult,
  verifyCredential,
} from "@idos-network/credentials";
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

  async getSharedCredentialFromIDOS(dataId: string): Promise<idOSCredential | undefined> {
    return getSharedCredential(this.#kwilClient, { id: dataId }).then((res) => res[0]);
  }

  async getSharedCredentialContentDecrypted(dataId: string): Promise<string> {
    const credentialCopy = await this.getSharedCredentialFromIDOS(dataId);

    invariant(credentialCopy, `Credential with id ${dataId} not found`);

    return await this.#noncedBox.decrypt(
      credentialCopy.content,
      credentialCopy.encryptor_public_key,
    );
  }

  async getGrantsCount(userId: string | null = null): Promise<number> {
    return getGrantsCount(this.#kwilClient, { user_id: userId ?? null }).then((res) => res.count);
  }

  async getAccessGrantsForCredential(credentialId: string): Promise<idOSGrant> {
    const params = { credential_id: credentialId };
    const accessGrants = await getAccessGrantsForCredential(this.#kwilClient, params);

    return accessGrants[0];
  }

  async getCredentialsSharedByUser(userId: string): Promise<Omit<idOSCredential, "content">[]> {
    return getCredentialsSharedByUser(this.#kwilClient, {
      user_id: userId,
      issuer_auth_public_key: null,
    });
  }

  async getReusableCredentialCompliantly(credentialId: string): Promise<idOSCredential> {
    const credential = await this.getSharedCredentialFromIDOS(credentialId);

    invariant(credential, `Credential with id ${credentialId} not found`);

    const accessGrant = await this.getAccessGrantsForCredential(credentialId);

    invariant(accessGrant, `Access grant with id ${credentialId} not found`);

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

  async getAccessGrants(params: GetGrantsPaginatedInput): Promise<{
    grants: idOSGrant[];
    totalCount: number;
  }> {
    return {
      grants: await getGrants(this.#kwilClient, params),
      totalCount: await this.getGrantsCount(params.user_id),
    };
  }

  async createAccessGrantByDag(
    params: CreateAccessGrantByDagInput,
  ): Promise<CreateAccessGrantByDagInput> {
    await createAccessGrantByDag(this.#kwilClient, params);
    return params;
  }

  async getPassportingPeers(): Promise<PassportingPeer[]> {
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
