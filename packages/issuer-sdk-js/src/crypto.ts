import * as base64 from "@stablelib/base64";
import nacl from "tweetnacl";

export async function encrypt(
  message: Uint8Array,
  encryptionPublicKey: Uint8Array,
  secretKey: Uint8Array,
) {
  const nonce = nacl.randomBytes(nacl.box.nonceLength);

  const encrypted = nacl.box(message, nonce, encryptionPublicKey, secretKey);

  if (encrypted === null)
    throw Error(
      `Couldn't encrypt. ${JSON.stringify(
        {
          message: base64.encode(message),
          nonce: base64.encode(nonce),
          receiverPublicKey: base64.encode(encryptionPublicKey),
        },
        null,
        2,
      )}`,
    );

  const fullMessage = new Uint8Array(nonce.length + encrypted.length);
  fullMessage.set(nonce, 0);
  fullMessage.set(encrypted, nonce.length);
  return base64.encode(fullMessage);
}
