import { KwilSigner, NodeKwil } from "@kwilteam/kwil-js";
import * as Base64Codec from "@stablelib/base64";
import * as BinaryCodec from "@stablelib/binary";
import * as BytesCodec from "@stablelib/bytes";
import * as sha256 from "@stablelib/sha256";
import * as Utf8Codec from "@stablelib/utf8";
import * as BorshCodec from "borsh";
import type { ethers } from "ethers";
import type * as nearAPI from "near-api-js";
import nacl from "tweetnacl";
import { assertNever } from "../types";
import { EvmGrants, type EvmGrantsOptions, type NearGrantsOptions } from "./grants";
import type { GrantChild } from "./grants/grant-child";
import { KwilWrapper } from "./kwil-wrapper";
import { implicitAddressFromPublicKey } from "./utils";

/* global crypto */

export type WalletType = "EVM" | "NEAR";

const kwilNep413Signer =
  (recipient: string) =>
  (keyPair: nearAPI.KeyPair) =>
  async (messageBytes: Uint8Array): Promise<Uint8Array> => {
    const message = Utf8Codec.decode(messageBytes);
    const nonceLength = 32;
    const nonce = crypto.getRandomValues(new Uint8Array(nonceLength));

    const nep413BorschSchema = {
      struct: {
        message: "string",
        nonce: { array: { type: "u8", len: nonceLength } },
        recipient: "string",
        callbackUrl: { option: "string" },
      },
    } as const;

    const tag = 2147484061; // 2**31 + 413

    const { signature } = await keyPair.sign(
      sha256.hash(
        BytesCodec.concat(
          BorshCodec.serialize("u32", tag),
          BorshCodec.serialize(nep413BorschSchema, { message, nonce, recipient }),
        ),
      ),
    );

    const kwilNep413BorschSchema = {
      struct: {
        tag: "u32",
        ...nep413BorschSchema.struct,
      },
    };

    const kwilNep413BorshParams = {
      tag,
      message,
      nonce,
      recipient,
    };

    const kwilNep413BorshPayload = BorshCodec.serialize(
      kwilNep413BorschSchema,
      kwilNep413BorshParams,
    );

    return BytesCodec.concat(
      BinaryCodec.writeUint16BE(kwilNep413BorshPayload.length),
      kwilNep413BorshPayload,
      signature,
    );
  };

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
  granteeSigner: nearAPI.utils.key_pair.KeyPair | ethers.Wallet,
): [KwilSigner, string] => {
  switch (chainType) {
    case "EVM": {
      const signer = granteeSigner as ethers.Wallet;
      return [new KwilSigner(signer, signer.address), signer.address];
    }
    case "NEAR": {
      const signer = granteeSigner as nearAPI.utils.key_pair.KeyPair;
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
  encryptionSecret: string;
  nodeUrl?: string;
  chainId?: string;
  dbId?: string;
  chainType: ChainType;
  granteeSigner: nearAPI.utils.key_pair.KeyPair | ethers.Wallet;
  granteeOptions?: EvmGrantsOptions | NearGrantsOptions;
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
  grants?: GrantChild;

  static async init(_: {
    encryptionSecret: string;
    nodeUrl?: string;
    chainId?: string;
    dbId?: string;
    chainType: "EVM";
    granteeSigner: ethers.Wallet;
    granteeOptions?: EvmGrantsOptions;
  }): Promise<idOSGrantee>;

  static async init(_: {
    encryptionSecret: string;
    nodeUrl?: string;
    chainId?: string;
    dbId?: string;
    chainType: "NEAR";
    granteeSigner: nearAPI.utils.key_pair.KeyPair;
    granteeOptions?: NearGrantsOptions;
  }): Promise<idOSGrantee>;

  static async init({
    encryptionSecret,
    nodeUrl = KwilWrapper.defaults.kwilProvider,
    chainId,
    dbId,
    chainType,
    granteeSigner,
    granteeOptions,
  }: idOSGranteeInitParams): Promise<idOSGrantee> {
    const kwil = new NodeKwil({ kwilProvider: nodeUrl, chainId: "" });

    chainId ||=
      // biome-ignore lint/style/noNonNullAssertion: I wanna let it fall to throwError.
      (await kwil.chainInfo({ disableWarning: true })).data?.chain_id! ||
      throwError("Can't discover chainId. You must pass it explicitly.");

    dbId ||=
      // biome-ignore lint/style/noNonNullAssertion: I wanna let it fall to throwError.
      (await kwil.listDatabases()).data?.filter(({ name }) => name === "idos")[0].dbid! ||
      throwError("Can't discover dbId. You must pass it explicitly.");

    const nodeKwil = new NodeKwil({ kwilProvider: nodeUrl, chainId });

    const [kwilSigner, address] = buildKwilSignerAndGrantee(chainType, granteeSigner);

    let grants;
    switch (chainType) {
      case "EVM": {
        const signer = granteeSigner as ethers.Wallet;
        grants = await EvmGrants.init({
          signer,
          options: (granteeOptions ?? {}) as EvmGrantsOptions,
        });
        break;
      }
      case "NEAR": {
        grants = undefined;
        break;
      }
      default:
        grants = throwError(`Unknown chainType: ${chainType}`);
    }

    return new idOSGrantee(
      NoncedBox.fromBase64SecretKey(encryptionSecret),
      nodeKwil,
      kwilSigner,
      dbId,
      chainType,
      address,
      grants,
    );
  }

  private constructor(
    noncedBox: NoncedBox,
    nodeKwil: NodeKwil,
    kwilSigner: KwilSigner,
    dbId: string,
    chainType: ChainType,
    address: string,
    grants: GrantChild | undefined,
  ) {
    this.noncedBox = noncedBox;
    this.nodeKwil = nodeKwil;
    this.kwilSigner = kwilSigner;
    this.dbId = dbId;
    this.chainType = chainType;
    this.address = address;
    this.grants = grants;
  }

  async fetchSharedCredentialFromIdos<T extends Record<string, unknown>>(
    dataId: string,
  ): Promise<T> {
    return (
      (await this.nodeKwil.call(
        {
          action: "get_credential_shared",
          dbid: this.dbId,
          inputs: [{ $id: dataId }],
        },
        this.kwilSigner,
        // biome-ignore lint/suspicious/noExplicitAny: NodeKwil doesn't have the best type defs.
      )) as any
    ).data.result[0] as unknown as T;
  }

  async getSharedCredentialContentDecrypted(dataId: string): Promise<string> {
    const credentialCopy = await this.fetchSharedCredentialFromIdos<{
      content: string;
      encryption_public_key: string;
    }>(dataId);

    return await this.noncedBox.decrypt(
      credentialCopy.content,
      credentialCopy.encryption_public_key,
    );
  }

  async createBySignature(
    ...args: Parameters<GrantChild["createBySignature"]>
  ): ReturnType<GrantChild["createBySignature"]> {
    if (!this.grants) throw new Error("NEAR is not implemented yet");

    return this.grants.createBySignature(...args);
  }

  async revokeBySignature(
    ...args: Parameters<GrantChild["revokeBySignature"]>
  ): ReturnType<GrantChild["revokeBySignature"]> {
    if (!this.grants) throw new Error("NEAR is not implemented yet");

    return this.grants.revokeBySignature(...args);
  }

  get grantee() {
    return this.address;
  }

  get encryptionPublicKey() {
    return Base64Codec.encode(this.noncedBox.keyPair.publicKey);
  }
}
