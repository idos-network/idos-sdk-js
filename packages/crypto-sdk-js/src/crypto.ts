import * as Base64Codec from "@stablelib/base64";
// import * as Utf8Codec from "@stablelib/utf8";
import nacl from "tweetnacl";

export async function encrypt(
  message: Uint8Array,
  encryptionPublicKey: Uint8Array,
  secretKey: Uint8Array,
) {
  const nonce = nacl.randomBytes(nacl.box.nonceLength);

  const encrypted = nacl.box(message, nonce, encryptionPublicKey, secretKey);

  if (encrypted === null)
    throw new Error(
      `Couldn't encrypt. ${JSON.stringify(
        {
          message: Base64Codec.encode(message),
          nonce: Base64Codec.encode(nonce),
          receiverPublicKey: Base64Codec.encode(encryptionPublicKey),
        },
        null,
        2,
      )}`,
    );

  const fullMessage = new Uint8Array(nonce.length + encrypted.length);
  fullMessage.set(nonce, 0);
  fullMessage.set(encrypted, nonce.length);

  return Base64Codec.encode(fullMessage);
}

export async function decrypt(
  encryptedMessage: Uint8Array,
  encryptionPublicKey: Uint8Array,
  secretKey: Uint8Array,
) {
  const nonce = encryptedMessage.slice(0, nacl.box.nonceLength);
  const encrypted = encryptedMessage.slice(nacl.box.nonceLength, encryptedMessage.length);

  const decrypted = nacl.box.open(encrypted, nonce, encryptionPublicKey, secretKey);
  debugger;

  if (decrypted === null)
    throw new Error(
      `Couldn't decrypt. ${JSON.stringify(
        {
          nonce: Base64Codec.encode(nonce),
          receiverPublicKey: Base64Codec.encode(encryptionPublicKey),
        },
        null,
        2,
      )}`,
    );

  return decrypted;
}
