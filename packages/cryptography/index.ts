import { base64Decode, base64Encode, utf8Decode } from "@idos-network/codecs";
import nacl from "tweetnacl";

/**
 * Encrypts a message using the recipient's public key and the sender's secret key.
 */
export function encryptContent(
  message: Uint8Array,
  recipientEncryptionPublicKey: Uint8Array,
  senderEncryptionSecretKey: Uint8Array,
): string {
  const nonce = nacl.randomBytes(nacl.box.nonceLength);
  const encrypted = nacl.box(
    message,
    nonce,
    recipientEncryptionPublicKey,
    senderEncryptionSecretKey,
  );

  if (encrypted === null)
    throw Error(
      `Couldn't encrypt. ${JSON.stringify(
        {
          message: base64Encode(message),
          nonce: base64Encode(nonce),
          recipientEncryptionPublicKey: base64Encode(recipientEncryptionPublicKey),
        },
        null,
        2,
      )}`,
    );

  const fullMessage = new Uint8Array(nonce.length + encrypted.length);
  fullMessage.set(nonce, 0);
  fullMessage.set(encrypted, nonce.length);

  return base64Encode(fullMessage);
}

/**
 * Decrypts a message using the sender's public key and the recipient's secret key.
 */
export function decryptContent(
  message: Uint8Array,
  senderEncryptionPublicKey: Uint8Array,
  recipientEncryptionSecretKey: Uint8Array,
): string {
  const nonce = message.slice(0, nacl.box.nonceLength);

  const decrypted = nacl.box.open(
    message,
    nonce,
    senderEncryptionPublicKey,
    recipientEncryptionSecretKey,
  );

  if (decrypted == null) {
    throw Error(
      `Couldn't decrypt. ${JSON.stringify(
        {
          message: base64Encode(message),
          nonce: base64Encode(nonce),
          senderEncryptionPublicKey: base64Encode(senderEncryptionPublicKey),
          recipientEncryptionSecretKey: base64Encode(recipientEncryptionSecretKey),
        },
        null,
        2,
      )}`,
    );
  }

  return utf8Decode(decrypted);
}
