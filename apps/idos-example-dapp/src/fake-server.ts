/*
  This should be in a remote server, since it has secrets.
  However, for the sake of simplicity, we're just using local async calls.

  WARNING
  The code in this file is still very raw. The intent is to package it neatly into a server-side SDK.
*/

import { idOS } from "@idos-network/idos-sdk";
import { WebKwil } from "@kwilteam/kwil-js";
import type { SignerSupplier } from "@kwilteam/kwil-js/dist/core/builders.d";
import * as Base64Codec from "@stablelib/base64";
import * as BinaryCodec from "@stablelib/binary";
import * as BytesCodec from "@stablelib/bytes";
import * as sha256 from "@stablelib/sha256";
import * as Utf8Codec from "@stablelib/utf8";
import * as BorshCodec from "borsh";
import { ethers } from "ethers";
import * as nearAPI from "near-api-js";
import nacl from "tweetnacl";

const ENCRYPTION_SECRET_KEY = Base64Codec.decode("2bu7SyMToRAuFn01/oqU3fx9ZHo9GKugQhQYmDuBXzg=");
const EVM_GRANTEE_PRIVATE_KEY =
  "0x515c2fed89c22eaa9d41cfce6e6e454fa0a39353e711d6a99f34b4ecab4b4859";
const NEAR_GRANTEE_PRIVATE_KEY =
  "ed25519:35pK192Az9znHcMtHK2bGExuZV3QLRk5Ln1EpXpq4bf6FtU5twG4hneMqkzrGhARKdq54LavCFy9sprqemC72ZLs";

const ENCRYPTION_KEY_PAIR = nacl.box.keyPair.fromSecretKey(ENCRYPTION_SECRET_KEY);

const EVM_NODE_URL = "https://ethereum-sepolia.publicnode.com";
const evmGrantee = new ethers.Wallet(
  EVM_GRANTEE_PRIVATE_KEY,
  new ethers.JsonRpcProvider(EVM_NODE_URL)
);

const nearGrantee = nearAPI.KeyPair.fromString(NEAR_GRANTEE_PRIVATE_KEY);

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

const decrypt = async (b64FullMessage: string, b64SenderPublicKey: string): Promise<string> => {
  const fullMessage = Base64Codec.decode(b64FullMessage);
  const senderPublicKey = Base64Codec.decode(b64SenderPublicKey);

  const nonce = fullMessage.slice(0, nacl.box.nonceLength);
  const message = fullMessage.slice(nacl.box.nonceLength, fullMessage.length);

  const decrypted = nacl.box.open(message, nonce, senderPublicKey, ENCRYPTION_KEY_PAIR.secretKey);

  if (decrypted == null) {
    throw Error(
      `Couldn't decrypt. ${JSON.stringify(
        {
          fullMessage: Base64Codec.encode(fullMessage),
          message: Base64Codec.encode(message),
          nonce: Base64Codec.encode(nonce),
          senderPublicKey: Base64Codec.encode(senderPublicKey),
          serverPublicKey: Base64Codec.encode(ENCRYPTION_KEY_PAIR.publicKey)
        },
        null,
        2
      )}`
    );
  }

  return Utf8Codec.decode(decrypted);
};

type WalletType = "EVM" | "NEAR";

interface KwilSigner {
  signer: SignerSupplier;
  publicKey: string;
  signatureType: string;
}

export const kwilSigners: Record<WalletType, KwilSigner> = {
  EVM: {
    signer: evmGrantee as unknown as SignerSupplier,
    publicKey: evmGrantee.signingKey.publicKey,
    signatureType: "secp256k1_ep"
  },
  NEAR: {
    signer: kwilNep413Signer(nearGrantee),
    publicKey: nearGrantee.getPublicKey().toString(),
    signatureType: "nep413"
  }
};

interface Grant {
  content: string;
  encryption_public_key: string;
}

const fetchAccessGrantDataFromIdos = async (signer, dataId: string): Promise<Grant> => {
  const kwilClient = new WebKwil({
    kwilProvider: idOS.kwil.kwilProvider,
    chainId: idOS.kwil.chainId
  });

  const res = await kwilClient.call(
    {
      dbid: idOS.kwil.dbId,
      action: "get_credential_shared",
      inputs: [{ $id: dataId }]
    },
    signer
  );

  if (!res.data || !res.data.result) throw new Error(res.toString());

  if (!res.data.result[0])
    throw new Error(
      `Programming error: access grant for credential ${dataId} exists in the smart contract, but the credential does not exist in idOS.`
    );

  return res.data.result[0] as unknown as Grant;
};

export const getAccessGrantsContentDecrypted = async (walletType: WalletType, dataId: string) => {
  const credentialCopy = await fetchAccessGrantDataFromIdos(kwilSigners[walletType], dataId);
  const decrypted_content = await decrypt(
    credentialCopy.content,
    credentialCopy.encryption_public_key
  );
  return decrypted_content;
};

export const publicInfo = {
  EVM: {
    grantee: evmGrantee.address
  },
  NEAR: {
    grantee: nearGrantee.getPublicKey().toString()
  },
  encryptionPublicKey: Base64Codec.encode(ENCRYPTION_KEY_PAIR.publicKey),
  lockTimeSpanSeconds: 3600 // one hour
};
