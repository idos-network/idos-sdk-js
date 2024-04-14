import { KwilSigner } from "@kwilteam/kwil-js";
import * as Base64Codec from "@stablelib/base64";
import * as BinaryCodec from "@stablelib/binary";
import * as BytesCodec from "@stablelib/bytes";
import * as sha256 from "@stablelib/sha256";
import * as Utf8Codec from "@stablelib/utf8";
import * as BorshCodec from "borsh";
import { ethers, getBytes } from "ethers";
import * as nearAPI from "near-api-js";
import nacl from "tweetnacl";
import { assertNever } from "../types";
import { KwilWrapper } from "./kwil-wrapper";
import { implicitAddressFromPublicKey } from "./utils";

export type WalletType = "EVM" | "NEAR";

const kwilNep413Signer =
  (keyPair: nearAPI.KeyPair) =>
  async (messageBytes: Uint8Array): Promise<Uint8Array> => {
    const message = Utf8Codec.decode(messageBytes);
    const nonceLength = 32;
    const nonce = crypto.getRandomValues(new Uint8Array(nonceLength));
    const recipient = "idos-example-dapp";

    const nep413BorschSchema = {
      struct: {
        message: "string",
        nonce: { array: { type: "u8", len: nonceLength } },
        recipient: "string",
        callbackUrl: { option: "string" }
      }
    } as const;

    const tag = 2147484061; // 2**31 + 413

    const { signature } = await keyPair.sign(
      sha256.hash(
        BytesCodec.concat(
          BorshCodec.serialize("u32", tag),
          BorshCodec.serialize(nep413BorschSchema, { message, nonce, recipient })
        )
      )
    );

    const kwilNep413BorschSchema = {
      struct: {
        tag: "u32",
        ...nep413BorschSchema.struct
      }
    };

    const kwilNep413BorshParams = {
      tag,
      message,
      nonce,
      recipient
    };

    const kwilNep413BorshPayload = BorshCodec.serialize(
      kwilNep413BorschSchema,
      kwilNep413BorshParams
    );

    return BytesCodec.concat(
      BinaryCodec.writeUint16BE(kwilNep413BorshPayload.length),
      kwilNep413BorshPayload,
      signature
    );
  };

export class NoncedBox {
  encryptionKeyPair: nacl.BoxKeyPair;

  constructor(encryptionKeyPair: nacl.BoxKeyPair) {
    this.encryptionKeyPair = encryptionKeyPair;
  }

  async decrypt(b64FullMessage: string, b64SenderPublicKey: string): Promise<string> {
    const fullMessage = Base64Codec.decode(b64FullMessage);
    const senderPublicKey = Base64Codec.decode(b64SenderPublicKey);

    const nonce = fullMessage.slice(0, nacl.box.nonceLength);
    const message = fullMessage.slice(nacl.box.nonceLength, fullMessage.length);

    const decrypted = nacl.box.open(
      message,
      nonce,
      senderPublicKey,
      this.encryptionKeyPair.secretKey
    );

    if (decrypted == null) {
      throw Error(
        `Couldn't decrypt. ${JSON.stringify(
          {
            fullMessage: Base64Codec.encode(fullMessage),
            message: Base64Codec.encode(message),
            nonce: Base64Codec.encode(nonce),
            senderPublicKey: Base64Codec.encode(senderPublicKey),
            receiverPublicKey: Base64Codec.encode(this.encryptionKeyPair.publicKey)
          },
          null,
          2
        )}`
      );
    }

    return Utf8Codec.decode(decrypted);
  }
}

type ChainType = "EVM" | "NEAR";

const buildKwilSignerAndGrantee = (
  chainType: ChainType,
  granteeSigner: nearAPI.utils.key_pair.KeyPair | ethers.Wallet
): [KwilSigner, string] => {
  switch (chainType) {
    case "EVM": {
      const signer = granteeSigner as ethers.Wallet;
      return [
        new KwilSigner(
          async (message: string | Uint8Array): Promise<Uint8Array> =>
            getBytes(await signer.signMessage(message)),
          signer.signingKey.publicKey,
          "secp256k1_ep"
        ),
        signer.address
      ];
    }
    case "NEAR": {
      const signer = granteeSigner as nearAPI.utils.key_pair.KeyPair;
      return [
        new KwilSigner(
          kwilNep413Signer(signer),
          implicitAddressFromPublicKey(signer.getPublicKey().toString()),
          "nep413"
        ),
        signer.getPublicKey().toString()
      ];
    }
    default:
      return assertNever(chainType, `Unexpected chainType: ${chainType}`);
  }
};

interface idOSGranteeInitParams {
  encryptionSecret: string;
  nodeUrl?: string;
  dbId?: string;
  chainType: ChainType;
  grantee: nearAPI.utils.key_pair.KeyPair | ethers.Wallet;
  address: string;
}

export class idOSGrantee {
  boxer: NoncedBox;
  kwilWrapper: KwilWrapper;
  chainType: ChainType;
  address: string;

  static async init({
    encryptionSecret,
    nodeUrl,
    dbId,
    chainType,
    grantee
  }: idOSGranteeInitParams) {
    const encryptionKeyPair = nacl.box.keyPair.fromSecretKey(Base64Codec.decode(encryptionSecret));

    const kwilWrapper = await KwilWrapper.init({ nodeUrl, dbId });
    const [signer, address] = buildKwilSignerAndGrantee(chainType, grantee);
    kwilWrapper.signer = signer;

    return new this(new NoncedBox(encryptionKeyPair), kwilWrapper, chainType, address);
  }

  private constructor(
    boxer: NoncedBox,
    kwilWrapper: KwilWrapper,
    chainType: ChainType,
    address: string
  ) {
    this.boxer = boxer;
    this.kwilWrapper = kwilWrapper;
    this.chainType = chainType;
    this.address = address;
  }

  async fetchSharedCredentialFromIdos<T extends Record<string, unknown>>(
    dataId: string
  ): Promise<T> {
    return (
      await this.kwilWrapper.call("get_credential_shared", { id: dataId }, undefined, true)
    )?.[0] as unknown as T;
  }

  async getSharedCredentialContentDecrypted(dataId: string) {
    const credentialCopy = await this.fetchSharedCredentialFromIdos<{
      content: string;
      encryption_public_key: string;
    }>(dataId);

    const decryptedContent = await this.boxer.decrypt(
      credentialCopy.content,
      credentialCopy.encryption_public_key
    );

    return decryptedContent;
  }

  get grantee() {
    return this.address;
  }

  get encryptionPublicKey() {
    return Base64Codec.encode(this.boxer.encryptionKeyPair.publicKey);
  }
}
