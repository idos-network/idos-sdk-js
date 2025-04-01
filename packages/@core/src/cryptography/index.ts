import nacl from "tweetnacl";
import { base64Decode, base64Encode, utf8Decode } from "../codecs";

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

function decryptContent(
  message: Uint8Array,
  nonce: Uint8Array,
  senderEncryptionPublicKey: Uint8Array,
  recipientEncryptionSecretKey: Uint8Array,
) {
  const decrypted = nacl.box.open(
    message,
    nonce,
    senderEncryptionPublicKey,
    recipientEncryptionSecretKey,
  );

  if (decrypted == null) {
    throw Error(
      `Couldn't decrypt the provided message. ${JSON.stringify(
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

  return decrypted;
}

export class NoncedBox {
  constructor(public readonly keyPair: nacl.BoxKeyPair) {}

  static nonceFromBase64SecretKey(secret: string): NoncedBox {
    return new NoncedBox(nacl.box.keyPair.fromSecretKey(base64Decode(secret)));
  }

  async decrypt(b64FullMessage: string, b64SenderPublicKey: string) {
    const decodedMessage = base64Decode(b64FullMessage);
    const senderEncryptionPublicKey = base64Decode(b64SenderPublicKey);
    const message = decodedMessage.slice(nacl.box.nonceLength, decodedMessage.length);
    const nonce = decodedMessage.slice(0, nacl.box.nonceLength);
    const content = decryptContent(
      message,
      nonce,
      senderEncryptionPublicKey,
      this.keyPair.secretKey,
    );

    return utf8Decode(content);
  }
}
