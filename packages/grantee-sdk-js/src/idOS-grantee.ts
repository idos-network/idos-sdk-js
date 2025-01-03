import { KwilSigner, NodeKwil } from "@kwilteam/kwil-js";
import { Utils as KwilUtils } from "@kwilteam/kwil-js";
import type { ActionBody } from "@kwilteam/kwil-js/dist/core/action";
import * as Base64Codec from "@stablelib/base64";
import * as Utf8Codec from "@stablelib/utf8";
import type { ethers } from "ethers";
import type { KeyPair } from "near-api-js";
import nacl from "tweetnacl";
import Grant from "../../idos-sdk-js/src/lib/grants/grant.ts";
import { DEFAULT_RECORDS_PER_PAGE } from "../../idos-sdk-js/src/lib/grants/grant.ts";
import { KwilWrapper } from "../../idos-sdk-js/src/lib/kwil-wrapper.ts";
import { assertNever } from "../../idos-sdk-js/src/lib/utils.ts";
import { implicitAddressFromPublicKey, kwilNep413Signer } from "../../kwil-nep413-signer/src";

export class NoncedBox {
  keyPair: nacl.BoxKeyPair;

  constructor(keyPair: nacl.BoxKeyPair) {
    this.keyPair = keyPair;
  }

  static fromBase64SecretKey(secret: string): NoncedBox {
    return new NoncedBox(nacl.box.keyPair.fromSecretKey(Base64Codec.decode(secret)));
  }

  async decrypt(b64FullMessage: string, b64SenderPublicKey: string): Promise<string> {
    const fullMessage = Base64Codec.decode(b64FullMessage);
    const senderPublicKey = Base64Codec.decode(b64SenderPublicKey);

    const nonce = fullMessage.slice(0, nacl.box.nonceLength);
    const message = fullMessage.slice(nacl.box.nonceLength, fullMessage.length);

    const decrypted = nacl.box.open(message, nonce, senderPublicKey, this.keyPair.secretKey);

    if (decrypted == null) {
      throw Error(
        `Couldn't decrypt. ${JSON.stringify(
          {
            fullMessage: Base64Codec.encode(fullMessage),
            message: Base64Codec.encode(message),
            nonce: Base64Codec.encode(nonce),
            senderPublicKey: Base64Codec.encode(senderPublicKey),
            receiverPublicKey: Base64Codec.encode(this.keyPair.publicKey),
          },
          null,
          2,
        )}`,
      );
    }

    return Utf8Codec.decode(decrypted);
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
      // biome-ignore lint/suspicious/noExplicitAny: TBD.
      return [new KwilSigner(signer as any, signer.address), signer.address];
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
    nodeUrl = KwilWrapper.defaults.kwilProvider,
    chainId,
    dbId,
    chainType,
    granteeSigner,
  }: idOSGranteeInitParams): Promise<idOSGrantee> {
    const kwil = new NodeKwil({ kwilProvider: nodeUrl, chainId: "" });

    chainId ||=
      // biome-ignore lint/style/noNonNullAssertion: I want to let it fall to throwError.
      (await kwil.chainInfo({ disableWarning: true })).data?.chain_id! ||
      throwError("Can't discover chainId. You must pass it explicitly.");

    dbId ||=
      // biome-ignore lint/style/noNonNullAssertion: I want to let it fall to throwError.
      (await kwil.listDatabases()).data?.filter(({ name }) => name === "idos")[0].dbid! ||
      throwError("Can't discover dbId. You must pass it explicitly.");

    const kwilWrapper = await KwilWrapper.init({ nodeUrl, dbId });

    const nodeKwil = new NodeKwil({ kwilProvider: nodeUrl, chainId });

    const [kwilSigner, address] = buildKwilSignerAndGrantee(chainType, granteeSigner);

    kwilWrapper.setSigner({
      accountId: address,
      // @ts-ignore
      signer: granteeSigner,
      signatureType: chainType === "EVM" ? "secp256k1_ep" : "nep413",
    });

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

  async fetchSharedCredentialFromIdos<T>(dataId: string): Promise<T> {
    return (await this.call("get_credential_shared", { id: dataId })) as unknown as T;
  }

  async getSharedCredentialContentDecrypted(dataId: string): Promise<string> {
    const [credentialCopy] =
      await this.fetchSharedCredentialFromIdos<
        {
          content: string;
          encryptor_public_key: string;
        }[]
      >(dataId);

    return await this.noncedBox.decrypt(
      credentialCopy.content,
      credentialCopy.encryptor_public_key,
    );
  }

  async getLocalAccessGrantsFromUserByAddress() {
    throw new Error("not implemented yet"); // @todo: update alexander to implement this
  }
  async getGrantsGrantedCount(): Promise<number> {
    return this.call("get_access_grants_granted_count", null) as unknown as number;
  }

  async getGrantsGranted(
    page: number,
    size = DEFAULT_RECORDS_PER_PAGE,
  ): Promise<{ grants: Grant[]; totalCount: number }> {
    return {
      grants:
        // biome-ignore lint/suspicious/noExplicitAny: intermediate type
        ((await this.call("get_access_grants_granted", { page, size })) as unknown as any[]).map(
          (grant): Grant => {
            return new Grant({
              id: grant.id,
              ownerUserId: grant.ag_owner_user_id,
              granteeAddress: grant.ag_grantee_wallet_identifier,
              dataId: grant.data_id,
              lockedUntil: grant.locked_until,
            });
          },
        ),
      totalCount: await this.getGrantsGrantedCount(),
    };
  }

  get grantee() {
    return this.address;
  }

  get encryptionPublicKey() {
    return Base64Codec.encode(this.noncedBox.keyPair.publicKey);
  }

  buildAction(actionName: string, inputs: Record<string, unknown> | null, description?: string) {
    const payload: ActionBody = {
      name: actionName,
      dbid: this.dbId,
      inputs: [],
    };

    if (description) {
      payload.description = `*${description}*`;
    }

    if (inputs) {
      const actionInput = new KwilUtils.ActionInput();
      for (const key in inputs) {
        // biome-ignore lint/suspicious/noExplicitAny: Inputs aren't typed.
        actionInput.put(`$${key}`, inputs[key] as any);
      }
      payload.inputs = [actionInput];
    }

    return payload;
  }

  async call(
    actionName: string,
    actionInputs: Record<string, unknown> | null,
    description?: string,
    useSigner = true,
  ) {
    if (useSigner && !this.kwilSigner) throw new Error("Call idOS.setSigner first.");

    return (
      await this.nodeKwil.call(
        this.buildAction(actionName, actionInputs, description),
        useSigner ? this.kwilSigner : undefined,
      )
    ).data?.result;
  }
}
