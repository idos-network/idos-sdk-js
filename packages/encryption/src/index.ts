import * as Base64Codec from "@stablelib/base64";

import nacl from "tweetnacl";
import { idOSKeyDerivation } from "./idOSKeyDerivation";

export function keyDerivation(
  password: string,
  salt: string,
): Promise<Uint8Array<ArrayBufferLike>> {
  return idOSKeyDerivation({ password, salt });
}

export function encrypt(
  message: Uint8Array,
  publicKey: Uint8Array,
  receiverPublicKey: Uint8Array,
): { content: Uint8Array<ArrayBuffer>; encryptorPublicKey: Uint8Array } {
  const nonce = nacl.randomBytes(nacl.box.nonceLength);
  const ephemeralKeyPair = nacl.box.keyPair();
  const encrypted = nacl.box(message, nonce, receiverPublicKey, ephemeralKeyPair.secretKey);

  if (encrypted === null)
    throw Error(
      `Couldn't encrypt. ${JSON.stringify(
        {
          message: Base64Codec.encode(message),
          nonce: Base64Codec.encode(nonce),
          receiverPublicKey: Base64Codec.encode(receiverPublicKey),
          localPublicKey: Base64Codec.encode(publicKey),
        },
        null,
        2,
      )}`,
    );

  const fullMessage = new Uint8Array(nonce.length + encrypted.length);
  fullMessage.set(nonce, 0);
  fullMessage.set(encrypted, nonce.length);

  return { content: fullMessage, encryptorPublicKey: ephemeralKeyPair.publicKey };
}

export async function decrypt(
  fullMessage: Uint8Array<ArrayBufferLike>,
  keyPair: nacl.BoxKeyPair,
  senderPublicKey: Uint8Array,
): Promise<Uint8Array<ArrayBufferLike>> {
  const nonce = fullMessage.slice(0, nacl.box.nonceLength);
  const message = fullMessage.slice(nacl.box.nonceLength, fullMessage.length);
  const decrypted = nacl.box.open(message, nonce, senderPublicKey, keyPair.secretKey);

  if (decrypted === null) {
    throw Error(
      `Couldn't decrypt. ${JSON.stringify(
        {
          fullMessage: Base64Codec.encode(fullMessage),
          message: Base64Codec.encode(message),
          nonce: Base64Codec.encode(nonce),
          senderPublicKey: Base64Codec.encode(senderPublicKey),
          localPublicKey: Base64Codec.encode(keyPair.publicKey),
        },
        null,
        2,
      )}`,
    );
  }

  return decrypted;
}
