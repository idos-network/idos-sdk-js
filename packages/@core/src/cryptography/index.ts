import nacl from "tweetnacl";
import { base64Encode } from "../codecs";

/**
 * Encrypts a message using the recipient's public key and the sender's secret key.
 */
export function encryptContent(
  message: Uint8Array,
  recipientEncryptionPublicKey: Uint8Array,
  senderEncryptionSecretKey: Uint8Array,
) {
  const nonce = nacl.randomBytes(nacl.box.nonceLength);
  const encrypted = nacl.box(
    message,
    nonce,
    recipientEncryptionPublicKey,
    senderEncryptionSecretKey,
  );

  if (encrypted === null)
    throw Error(
      `Couldn't encrypt the provided message. ${JSON.stringify(
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

  return fullMessage;
}

/**
 * Decrypts a message using the sender's public key and the recipient's secret key.
 */
export function decryptContent(
  fullMessage: Uint8Array,
  senderEncryptionPublicKey: Uint8Array,
  recipientEncryptionSecretKey: Uint8Array,
) {
  const nonce = fullMessage.slice(0, nacl.box.nonceLength);
  const message = fullMessage.slice(nacl.box.nonceLength, fullMessage.length);
  const decrypted = nacl.box.open(
    message,
    nonce,
    senderEncryptionPublicKey,
    recipientEncryptionSecretKey,
  );
  if (decrypted === null) {
    throw Error(
      `Couldn't decrypt. ${JSON.stringify(
        {
          fullMessage: base64Encode(fullMessage),
          message: base64Encode(message),
          nonce: base64Encode(nonce),
          senderPublicKey: base64Encode(senderEncryptionPublicKey),
          localPublicKey: base64Encode(recipientEncryptionSecretKey),
        },
        null,
        2,
      )}`,
    );
  }

  return decrypted;
}
