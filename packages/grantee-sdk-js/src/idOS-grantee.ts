import { base64Decode, base64Encode, utf8Decode } from "@idos-network/codecs";
import { decryptContent } from "@idos-network/cryptography";
import {
  type KwilActionClient,
  createNodeKwilClient,
} from "@idos-network/kwil-actions/create-kwil-client";
import { getSharedCredential } from "@idos-network/kwil-actions/credentials";
import { getGrants, getGrantsCount } from "@idos-network/kwil-actions/grants";
import { implicitAddressFromPublicKey, kwilNep413Signer } from "@idos-network/kwil-nep413-signer";
import { KwilSigner } from "@kwilteam/kwil-js";
import type { ethers } from "ethers";
import type { KeyPair } from "near-api-js";
import nacl from "tweetnacl";

const DEFAULT_RECORDS_PER_PAGE = 7;

const assertNever = (_: never, msg: string): never => {
  throw new Error(msg);
};

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

type ChainType = "EVM" | "NEAR";

const buildKwilSignerAndGrantee = (
  chainType: ChainType,
  granteeSigner: KeyPair | ethers.Wallet,
): [KwilSigner, string] => {
  switch (chainType) {
    case "EVM": {
      const signer = granteeSigner as ethers.Wallet;
      return [new KwilSigner(signer, signer.address), signer.address];
    }
    case "NEAR": {
      const signer = granteeSigner as KeyPair;
      const publicKey = signer.getPublicKey().toString();
      return [
        new KwilSigner(
          kwilNep413Signer("idos-grantee")(signer),
          implicitAddressFromPublicKey(publicKey),
          "nep413",
        ),
        publicKey,
      ];
    }
    default:
      return assertNever(chainType, `Unexpected chainType: ${chainType}`);
  }
};

interface idOSGranteeInitParams {
  recipientEncryptionPrivateKey: string;
  nodeUrl?: string;
  chainId?: string;
  dbId?: string;
  chainType: ChainType;
  granteeSigner: KeyPair | ethers.Wallet;
}

export class idOSGrantee {
  static async init(_: {
    recipientEncryptionPrivateKey: string;
    nodeUrl?: string;
    chainId?: string;
    dbId?: string;
    chainType: "EVM";
    granteeSigner: ethers.Wallet;
  }): Promise<idOSGrantee>;

  static async init(_: {
    recipientEncryptionPrivateKey: string;
    nodeUrl: string;
    chainId?: string;
    dbId?: string;
    chainType: "NEAR";
    granteeSigner: KeyPair;
  }): Promise<idOSGrantee>;

  static async init({
    recipientEncryptionPrivateKey,
    nodeUrl = "https://nodes.idos.network",
    chainId,
    dbId,
    chainType,
    granteeSigner,
  }: idOSGranteeInitParams): Promise<idOSGrantee> {
    const kwilClient = await createNodeKwilClient({
      nodeUrl,
      chainId,
      dbId,
    });

    const [kwilSigner, address] = buildKwilSignerAndGrantee(chainType, granteeSigner);

    kwilClient.setSigner(kwilSigner);

    return new idOSGrantee(
      NoncedBox.nonceFromBase64SecretKey(recipientEncryptionPrivateKey),
      kwilClient,
      address,
    );
  }

  private constructor(
    private readonly noncedBox: NoncedBox,
    private readonly kwilClient: KwilActionClient,
    private readonly address: string,
  ) {}

  get grantee() {
    return this.address;
  }

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

  async getGrants(page = 1, size = DEFAULT_RECORDS_PER_PAGE) {
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
