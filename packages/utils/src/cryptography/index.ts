import nacl from "tweetnacl";
import { base64Decode, base64Encode, utf8Decode } from "../codecs";

/**
 * Encrypts a message using the recipient's public key and the sender's secret key.
 */
export function encryptContent(
  message: Uint8Array,
  recipientEncryptionPublicKey: Uint8Array,
  senderEncryptionSecretKey: Uint8Array,
): Uint8Array {
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
function decryptContent(
  message: Uint8Array,
  nonce: Uint8Array,
  senderEncryptionPublicKey: Uint8Array,
  recipientEncryptionSecretKey: Uint8Array,
): Uint8Array {
  const decrypted = nacl.box.open(
    message,
    nonce,
    senderEncryptionPublicKey,
    recipientEncryptionSecretKey,
  );

  if (decrypted === null) {
    throw Error(
      `Couldn't decrypt the provided message. ${JSON.stringify(
        {
          message: base64Encode(message),
          nonce: base64Encode(nonce),
          senderEncryptionPublicKey: base64Encode(senderEncryptionPublicKey),
        },
        null,
        2,
      )}`,
    );
  }

  return decrypted;
}

export function generatePassword(): string {
  const alphabet =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?";
  const length = 20;
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  let password = "";
  for (let i = 0; i < length; i++) {
    password += alphabet[array[i] % alphabet.length];
  }

  return password;
}

export class NoncedBox {
  readonly keyPair: nacl.BoxKeyPair;

  constructor(keyPair: nacl.BoxKeyPair) {
    this.keyPair = keyPair;
  }

  static nonceFromBase64SecretKey(secret: string): NoncedBox {
    return new NoncedBox(nacl.box.keyPair.fromSecretKey(base64Decode(secret)));
  }

  async decrypt(b64FullMessage: string, b64SenderPublicKey: string): Promise<string> {
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
