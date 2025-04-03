import { NoncedBox, base64Encode, hexEncodeSha256Hash, utf8Encode } from "@idos-network/core";
import {
  type GetGrantsParams,
  getAccessGrantsForCredential,
  getCredentialsSharedByUser,
  getGrants,
  getGrantsCount,
  getSharedCredential,
} from "@idos-network/core/kwil-actions";
import {
  type KwilActionClient,
  createNodeKwilClient,
  createServerKwilSigner,
} from "@idos-network/core/kwil-infra";
import type { idOSCredential, idOSGrant } from "@idos-network/core/types";
import type { ethers } from "ethers";
import type { KeyPair } from "near-api-js";
import type { SignKeyPair } from "tweetnacl";

interface idOSConsumerInitParams {
  recipientEncryptionPrivateKey: string;
  nodeUrl?: string;
  chainId?: string;
  consumerSigner: KeyPair | SignKeyPair | ethers.Wallet;
}

export class idOSConsumer {
  static async init({
    recipientEncryptionPrivateKey,
    nodeUrl = "https://nodes.idos.network",
    chainId,
    consumerSigner,
  }: idOSConsumerInitParams): Promise<idOSConsumer> {
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

  private constructor(
    private readonly noncedBox: NoncedBox,
    public readonly kwilClient: KwilActionClient,
    public readonly address: string,
  ) {}

  get encryptionPublicKey() {
    return base64Encode(this.noncedBox.keyPair.publicKey);
  }

  async getSharedCredentialFromIDOS(dataId: string): Promise<idOSCredential> {
    return getSharedCredential(this.kwilClient, dataId);
  }

  async getSharedCredentialContentDecrypted(dataId: string): Promise<string> {
    const credentialCopy = await this.getSharedCredentialFromIDOS(dataId);

    return await this.noncedBox.decrypt(
      credentialCopy.content,
      credentialCopy.encryptor_public_key,
    );
  }

  async getGrantsCount(): Promise<number> {
    return getGrantsCount(this.kwilClient);
  }

  async getCredentialAccessGrant(credentialId: string): Promise<idOSGrant> {
    const params = { credential_id: credentialId };
    const accessGrants = await getAccessGrantsForCredential(this.kwilClient, params);

    return accessGrants[0];
  }

  async getCredentialsSharedByUser(userId: string) {
    const credentials = await getCredentialsSharedByUser(this.kwilClient, userId);
    return credentials;
  }

  async getReusableCredentialCompliantly(credentialId: string): Promise<idOSCredential> {
    const credential = await this.getSharedCredentialFromIDOS(credentialId);

    const accessGrant = await this.getCredentialAccessGrant(credentialId);

    // @todo: ensure the AG they used was inserted by a known OE. This will be done by querying the registry and matching the `inserter_id` in the AG with the id of the OE.

    const credentialContent = await this.noncedBox.decrypt(
      credential.content,
      credential.encryptor_public_key,
    );

    const contentHash = hexEncodeSha256Hash(utf8Encode(credentialContent));

    if (contentHash !== accessGrant.content_hash) {
      throw new Error("Credential content hash does not match the access grant hash");
    }

    return credential;
  }

  async getGrants(params: GetGrantsParams) {
    return {
      grants: (await getGrants(this.kwilClient, params)).map((grant) => ({
        id: grant.id,
        ownerUserId: grant.ag_owner_user_id,
        consumerAddress: grant.ag_grantee_wallet_identifier,
        dataId: grant.data_id,
        lockedUntil: grant.locked_until,
      })),
      totalCount: await this.getGrantsCount(),
    };
  }
}
