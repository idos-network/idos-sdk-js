import {
  base64Decode,
  base64Encode,
  hexEncode,
  sha256Hash,
  utf8Decode,
} from "@idos-network/codecs";
import type { idOSCredential, idOSGrant } from "@idos-network/idos-sdk-types";
import { implicitAddressFromPublicKey, kwilNep413Signer } from "@idos-network/kwil-nep413-signer";
import { KwilSigner, NodeKwil } from "@kwilteam/kwil-js";
import { Utils as KwilUtils } from "@kwilteam/kwil-js";
import type { ActionBody } from "@kwilteam/kwil-js/dist/core/action";
import type { ethers } from "ethers";
import type { KeyPair } from "near-api-js";
import nacl from "tweetnacl";

const DEFAULT_RECORDS_PER_PAGE = 7;
const assertNever = (_: never, msg: string): never => {
  throw new Error(msg);
};

export class NoncedBox {
  keyPair: nacl.BoxKeyPair;

  constructor(keyPair: nacl.BoxKeyPair) {
    this.keyPair = keyPair;
  }

  static fromBase64SecretKey(secret: string): NoncedBox {
    return new NoncedBox(nacl.box.keyPair.fromSecretKey(base64Decode(secret)));
  }

  async decrypt(b64FullMessage: string, b64SenderPublicKey: string): Promise<string> {
    const fullMessage = base64Decode(b64FullMessage);
    const senderPublicKey = base64Decode(b64SenderPublicKey);

    const nonce = fullMessage.slice(0, nacl.box.nonceLength);
    const message = fullMessage.slice(nacl.box.nonceLength, fullMessage.length);

    const decrypted = nacl.box.open(message, nonce, senderPublicKey, this.keyPair.secretKey);

    if (decrypted == null) {
      throw Error(
        `Couldn't decrypt. ${JSON.stringify(
          {
            fullMessage: base64Encode(fullMessage),
            message: base64Encode(message),
            nonce: base64Encode(nonce),
            senderPublicKey: base64Encode(senderPublicKey),
            receiverPublicKey: base64Encode(this.keyPair.publicKey),
          },
          null,
          2,
        )}`,
      );
    }

    return utf8Decode(decrypted);
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

const throwError = (message: string): never => {
  throw new Error(message);
};

export class idOSGrantee {
  noncedBox: NoncedBox;
  nodeKwil: NodeKwil;
  kwilSigner: KwilSigner;
  dbId: string;
  chainType: ChainType;
  address: string;

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
    const kwil = new NodeKwil({ kwilProvider: nodeUrl, chainId: "" });

    chainId ||=
      // biome-ignore lint/style/noNonNullAssertion: I want to let it fall to throwError.
      (await kwil.chainInfo({ disableWarning: true })).data?.chain_id! ||
      throwError("Can't discover `chainId`. You must pass it explicitly.");

    dbId ||=
      // biome-ignore lint/style/noNonNullAssertion: I want to let it fall to throwError.
      (await kwil.listDatabases()).data?.filter(({ name }) => name === "idos")[0].dbid! ||
      throwError("Can't discover `dbId`. You must pass it explicitly.");

    const nodeKwil = new NodeKwil({ kwilProvider: nodeUrl, chainId });

    const [kwilSigner, address] = buildKwilSignerAndGrantee(chainType, granteeSigner);

    return new idOSGrantee(
      NoncedBox.fromBase64SecretKey(recipientEncryptionPrivateKey),
      nodeKwil,
      kwilSigner,
      dbId,
      chainType,
      address,
    );
  }

  private constructor(
    noncedBox: NoncedBox,
    nodeKwil: NodeKwil,
    kwilSigner: KwilSigner,
    dbId: string,
    chainType: ChainType,
    address: string,
  ) {
    this.noncedBox = noncedBox;
    this.nodeKwil = nodeKwil;
    this.kwilSigner = kwilSigner;
    this.dbId = dbId;
    this.chainType = chainType;
    this.address = address;
  }

  get grantee() {
    return this.address;
  }

  get encryptionPublicKey() {
    return base64Encode(this.noncedBox.keyPair.publicKey);
  }

  async getSharedCredentialFromIDOS(dataId: string) {
    return await this.#call<[idOSCredential]>("get_credential_shared", { id: dataId });
  }

  async decryptCredentialContent(credential: idOSCredential) {
    return await this.noncedBox.decrypt(credential.content, credential.encryptor_public_key);
  }

  async getSharedCredentialContentDecrypted(dataId: string): Promise<string> {
    const [credentialCopy] = await this.getSharedCredentialFromIDOS(dataId);
    return this.decryptCredentialContent(credentialCopy);
  }

  async hashCredential(credentialContent: string) {
    const encodedContent = new TextEncoder().encode(credentialContent);
    return hexEncode(sha256Hash(encodedContent), true);
  }

  // passed grant is OE2 AG. we need OE1 AG to decrypt the content cuz both of them should have the same data_id
  async checkCredentialValidity(grant: idOSGrant) {
    const receivedHash = grant.hash;
    const decryptedContent = await this.getSharedCredentialContentDecrypted(grant.data_id);
    const expectedHash = await this.hashCredential(decryptedContent); // this is C1.1 hash
    return receivedHash === expectedHash;
  }

  async getLocalAccessGrantsFromUserByAddress() {
    // @todo: update Alexandr to implement this
    throw new Error("Not implemented yet");
  }

  async getGrantsCount(): Promise<number> {
    return this.#call("get_access_grants_granted_count", null) as unknown as number;
  }

  async getGrants(page = 1, size = DEFAULT_RECORDS_PER_PAGE) {
    return {
      grants: (await this.#call<idOSGrant[]>("get_access_grants_granted", { page, size })).map(
        (grant: idOSGrant) => {
          return {
            id: grant.id,
            ownerUserId: grant.ag_owner_user_id,
            granteeAddress: grant.ag_grantee_wallet_identifier,
            dataId: grant.data_id,
            lockedUntil: grant.locked_until,
          };
        },
      ),
      totalCount: await this.getGrantsCount(),
    };
  }

  #buildAction(actionName: string, inputs: Record<string, unknown> | null, description?: string) {
    const payload: ActionBody = {
      name: actionName,
      dbid: this.dbId,
      inputs: [],
    };

    if (description) {
      payload.description = `*${description}*`;
    }

    if (inputs) {
      const prefixedEntries = Object.entries(inputs).map(([key, value]) => [`$${key}`, value]);
      const prefixedObject = Object.fromEntries(prefixedEntries);
      payload.inputs = [KwilUtils.ActionInput.fromObject(prefixedObject)];
    }

    return payload;
  }

  async #call<T = unknown>(
    actionName: string,
    actionInputs: Record<string, unknown> | null,
    description?: string,
    useSigner = true,
  ): Promise<T> {
    if (useSigner && !this.kwilSigner) throw new Error("Call `idOS.setSigner` first.");

    return (
      await this.nodeKwil.call(
        this.#buildAction(actionName, actionInputs, description),
        useSigner ? this.kwilSigner : undefined,
      )
    ).data?.result as T;
  }
}
