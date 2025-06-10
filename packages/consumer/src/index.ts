import { NoncedBox, base64Encode, hexEncodeSha256Hash, utf8Encode } from "@idos-network/core";
import {
  type CreateAccessGrantByDAGParams,
  type GetGrantsParams,
  createAccessGrantByDag,
  getAccessGrantsForCredential,
  getCredentialsSharedByUser,
  getGrants,
  getGrantsCount,
  getPassportingPeers,
  getSharedCredential,
} from "@idos-network/core/kwil-actions";
import {
  type KwilActionClient,
  type KwilSignerType,
  createNodeKwilClient,
  createServerKwilSigner,
} from "@idos-network/core/kwil-infra";
import type { PassportingPeer, idOSCredential, idOSGrant } from "@idos-network/core/types";
import {
  type AvailableIssuerType,
  type Credentials,
  type VerifiableCredential,
  type VerifiableCredentialSubject,
  verifyCredentials,
} from "@idos-network/credentials";
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
    );
  }

  private constructor(noncedBox: NoncedBox, kwilClient: KwilActionClient, address: string) {
    this.#noncedBox = noncedBox;
    this.#kwilClient = kwilClient;
    this.address = address;
  }

  get encryptionPublicKey(): string {
    return base64Encode(this.#noncedBox.keyPair.publicKey);
  }

  async getSharedCredentialFromIDOS(dataId: string): Promise<idOSCredential | undefined> {
    return getSharedCredential(this.#kwilClient, dataId);
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
    return getGrantsCount(this.#kwilClient, { user_id: userId });
  }

  async getAccessGrantsForCredential(credentialId: string): Promise<idOSGrant> {
    const params = { credential_id: credentialId };
    const accessGrants = await getAccessGrantsForCredential(this.#kwilClient, params);

    return accessGrants[0];
  }

  async getCredentialsSharedByUser(userId: string): Promise<idOSCredential[]> {
    const credentials = await getCredentialsSharedByUser(this.#kwilClient, userId);
    return credentials;
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

  async getAccessGrants(params: GetGrantsParams): Promise<{
    grants: idOSGrant[];
    totalCount: number;
  }> {
    return {
      grants: await getGrants(this.#kwilClient, params),
      totalCount: await this.getGrantsCount(params.user_id),
    };
  }

  async createAccessGrantByDag(
    params: CreateAccessGrantByDAGParams,
  ): Promise<CreateAccessGrantByDAGParams> {
    return createAccessGrantByDag(this.#kwilClient, params);
  }

  async getPassportingPeers(): Promise<PassportingPeer[]> {
    return getPassportingPeers(this.#kwilClient);
  }

  async verifyCredentials<K = VerifiableCredentialSubject>(
    credentials: VerifiableCredential<K>,
    issuers: AvailableIssuerType[],
  ): Promise<boolean> {
    return verifyCredentials<K>(credentials, issuers);
  }
}

export type {
  idOSCredential,
  idOSGrant,
  Credentials,
  VerifiableCredential,
  VerifiableCredentialSubject,
  AvailableIssuerType,
};
