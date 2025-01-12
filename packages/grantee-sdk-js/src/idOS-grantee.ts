import { base64Decode, base64Encode, utf8Decode } from "@idos-network/codecs";
import { decryptContent } from "@idos-network/cryptography";
import {
  type KwilActionClient,
  createNodeKwilClient,
} from "@idos-network/kwil-actions/create-kwil-client";
import { createKwilSigner } from "@idos-network/kwil-actions/create-kwil-signer";
import { getSharedCredential } from "@idos-network/kwil-actions/credentials";
import { getGrants, getGrantsCount } from "@idos-network/kwil-actions/grants";
import type { ethers } from "ethers";
import type { KeyPair } from "near-api-js";
import nacl from "tweetnacl";

export class NoncedBox {
  constructor(public readonly keyPair: nacl.BoxKeyPair) {}

  static nonceFromBase64SecretKey(secret: string): NoncedBox {
    return new NoncedBox(nacl.box.keyPair.fromSecretKey(base64Decode(secret)));
  }

  async decrypt(b64FullMessage: string, b64SenderPublicKey: string) {
    const decodedMessage = base64Decode(b64FullMessage);
    const senderPublicKey = base64Decode(b64SenderPublicKey);
    const message = decodedMessage.slice(nacl.box.nonceLength, decodedMessage.length);
    const content = decryptContent(message, senderPublicKey, this.keyPair.secretKey);

    return utf8Decode(content);
  }
}

interface idOSGranteeInitParams {
  recipientEncryptionPrivateKey: string;
  nodeUrl?: string;
  chainId?: string;
  dbId?: string;
  granteeSigner: KeyPair | ethers.Wallet;
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

    const signer = createKwilSigner(granteeSigner);
    kwilClient.setSigner(signer);

    return new idOSGrantee(
      NoncedBox.nonceFromBase64SecretKey(recipientEncryptionPrivateKey),
      kwilClient,
    );
  }

  private constructor(
    private readonly noncedBox: NoncedBox,
    private readonly kwilClient: KwilActionClient,
  ) {}

  get encryptionPublicKey() {
    return base64Encode(this.noncedBox.keyPair.publicKey);
  }

  async getSharedCredentialFromIDOS(dataId: string) {
    return getSharedCredential(this.kwilClient, dataId);
  }

  async getSharedCredentialContentDecrypted(dataId: string) {
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

  async getGrantsCount() {
    return getGrantsCount(this.kwilClient);
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
