import * as BinaryCodec from "@stablelib/binary";
import * as BytesCodec from "@stablelib/bytes";
import { encode as encodeHex } from "@stablelib/hex";
import * as sha256 from "@stablelib/sha256";
import * as Utf8Codec from "@stablelib/utf8";
import * as BorshCodec from "borsh";
import bs58 from "bs58";
import type { KeyPair } from "near-api-js";

export const implicitAddressFromPublicKey = (publicKey: string) => {
  const key_without_prefix = publicKey.replace(/^ed25519:/, "");
  const implicitAddress = encodeHex(bs58.decode(key_without_prefix));
  return implicitAddress;
};

export const kwilNep413Signer =
  (recipient: string) =>
  (keyPair: KeyPair) =>
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

    const { signature } = keyPair.sign(
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
