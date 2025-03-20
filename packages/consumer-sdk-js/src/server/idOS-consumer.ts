import {
  base64Decode,
  base64Encode,
  hexEncodeSha256Hash,
  utf8Decode,
  utf8Encode,
} from "@idos-network/core/codecs";
import { decryptContent } from "@idos-network/core/cryptography";
import {
  type KwilActionClient,
  createKwilSigner,
  createNodeKwilClient,
  getAccessGrantsForCredential,
  getCredentialsSharedByUser,
  getGrants,
  getGrantsCount,
  getSharedCredential,
} from "@idos-network/core/kwil-actions";
import type { idOSCredential, idOSGrant } from "@idos-network/core/types";
import type { ethers } from "ethers";
import type { KeyPair } from "near-api-js";
import nacl, { type SignKeyPair } from "tweetnacl";

export class NoncedBox {
  constructor(public readonly keyPair: nacl.BoxKeyPair) {}

  static nonceFromBase64SecretKey(secret: string): NoncedBox {
    return new NoncedBox(nacl.box.keyPair.fromSecretKey(base64Decode(secret)));
  }

  async decrypt(b64FullMessage: string, b64SenderPublicKey: string) {
    const decodedMessage = base64Decode(b64FullMessage);
    const senderEncryptionPublicKey = base64Decode(b64SenderPublicKey);
    const message = decodedMessage.slice(nacl.box.nonceLength, decodedMessage.length);
    const nonce = decodedMessage.slice(0, nacl.box.nonceLength);
    const content = decryptContent(
      message,
      nonce,
      senderEncryptionPublicKey,
      this.keyPair.secretKey,
    );

    return utf8Decode(content);
  }
}

interface idOSConsumerInitParams {
  recipientEncryptionPrivateKey: string;
  nodeUrl?: string;
  chainId?: string;
  dbId?: string;
  consumerSigner: KeyPair | SignKeyPair | ethers.Wallet;
}

export class idOSConsumer {
  static async init({
    recipientEncryptionPrivateKey,
    nodeUrl = "https://nodes.idos.network",
    chainId,
    dbId,
    consumerSigner,
  }: idOSConsumerInitParams): Promise<idOSConsumer> {
    const kwilClient = await createNodeKwilClient({
      nodeUrl,
      chainId,
      dbId,
    });

    const [signer, address] = createKwilSigner(consumerSigner);
    kwilClient.setSigner(signer);

    return new idOSConsumer(
      NoncedBox.nonceFromBase64SecretKey(recipientEncryptionPrivateKey),
      kwilClient,
      address,
    );
  }

  private constructor(
    private readonly noncedBox: NoncedBox,
    private readonly kwilClient: KwilActionClient,
    public readonly address: string,
  ) {}

  get encryptionPublicKey() {
    return base64Encode(this.noncedBox.keyPair.publicKey);
  }

  async getSharedCredentialFromIDOS(dataId: string): Promise<idOSCredential[]> {
    return getSharedCredential(this.kwilClient, dataId);
  }

  async getSharedCredentialContentDecrypted(dataId: string): Promise<string> {
    const [credentialCopy] = await this.getSharedCredentialFromIDOS(dataId);

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
    const [credential] = await this.getSharedCredentialFromIDOS(credentialId);

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

  async getGrants(page = 1, size = 7) {
    return {
      grants: (await getGrants(this.kwilClient, page, size)).map((grant) => ({
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
