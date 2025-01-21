import {
  base64Decode,
  base64Encode,
  hexEncodeSha256Hash,
  utf8Decode,
  utf8Encode,
} from "@idos-network/codecs";
import { decryptContent } from "@idos-network/cryptography";
import type { idOSCredential, idOSGrant } from "@idos-network/idos-sdk-types";
import {
  type KwilActionClient,
  createNodeKwilClient,
} from "@idos-network/kwil-actions/create-kwil-client";
import { createKwilSigner } from "@idos-network/kwil-actions/create-kwil-signer";
import {
  getAccessGrantsForCredential,
  getSharedCredential,
} from "@idos-network/kwil-actions/credentials";
import { getGrants, getGrantsCount } from "@idos-network/kwil-actions/grants";
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

interface idOSGranteeInitParams {
  recipientEncryptionPrivateKey: string;
  nodeUrl?: string;
  chainId?: string;
  dbId?: string;
  granteeSigner: KeyPair | SignKeyPair | ethers.Wallet;
}

export class idOSGrantee {
  static async init({
    recipientEncryptionPrivateKey,
    nodeUrl = "https://nodes.idos.network",
    chainId,
    dbId,
    granteeSigner,
  }: idOSGranteeInitParams): Promise<idOSGrantee> {
    const kwilClient = await createNodeKwilClient({
      nodeUrl,
      chainId,
      dbId,
    });

    const [signer, address] = createKwilSigner(granteeSigner);
    kwilClient.setSigner(signer);

    return new idOSGrantee(
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

  async getLocalAccessGrantsFromUserByAddress() {
    // @todo: update Alexandr to implement this
    throw new Error("Not implemented yet");
  }

  async getGrantsCount(): Promise<number> {
    return getGrantsCount(this.kwilClient);
  }

  async fetchCredentialGrant(credentialId: string): Promise<idOSGrant> {
    if (!credentialId) throw new Error("Missing credentialId");
    const params = { credential_id: credentialId };
    const grant = await getAccessGrantsForCredential(this.kwilClient, params);
    if (!grant) throw new Error("Grant not found");
    return grant;
  }

  async isValidCredential(credentialId: string) {
    const grant = await this.fetchCredentialGrant(credentialId);
    const credentialContent = await this.getSharedCredentialContentDecrypted(grant.data_id);
    const contentHash = hexEncodeSha256Hash(utf8Encode(credentialContent));
    if (contentHash !== grant.hash)
      throw new Error("Hash mismatch between idOSCredential content and idOSGrant content hash");
    return true;
  }

  async getGrants(page = 1, size = 7) {
    return {
      grants: (await getGrants(this.kwilClient, page, size)).map((grant) => ({
        id: grant.id,
        ownerUserId: grant.ag_owner_user_id,
        granteeAddress: grant.ag_grantee_wallet_identifier,
        dataId: grant.data_id,
        lockedUntil: grant.locked_until,
      })),
      totalCount: await this.getGrantsCount(),
    };
  }
}
