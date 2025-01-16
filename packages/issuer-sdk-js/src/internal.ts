import { base64Encode, hexEncodeSha256Hash } from "@idos-network/codecs";
import { Utils } from "@kwilteam/kwil-js";
import nacl from "tweetnacl";

export function ensureEntityId<T extends { id?: string }>(entity: T): { id: string } & T {
  return {
    ...entity,
    id: entity.id ?? crypto.randomUUID(),
  };
}

// biome-ignore lint/suspicious/noExplicitAny: Using `any` is fine over here as we don't need to be strict about types being passed in.
export function createActionInput(params: Record<string, any>): Utils.ActionInput {
  const payload = ensureEntityId(params);
  const prefixedEntries = Object.entries(payload).map(([key, value]) => [`$${key}`, value]);
  const prefixedObject = Object.fromEntries(prefixedEntries);
  return Utils.ActionInput.fromObject(prefixedObject);
}

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
      `Couldn't encrypt. ${JSON.stringify(
        {
          message: base64Encode(message),
          nonce: base64Encode(nonce),
          receiverPublicKey: base64Encode(recipientEncryptionPublicKey),
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

export const decryptContent = (
  fullMessage: Uint8Array,
  senderPublicKey: Uint8Array,
  secretKey: Uint8Array,
) => {
  const nonce = fullMessage.slice(0, nacl.box.nonceLength);
  const message = fullMessage.slice(nacl.box.nonceLength, fullMessage.length);
  const decrypted = nacl.box.open(message, nonce, senderPublicKey, secretKey);

  if (decrypted === null) {
    throw Error(
      `Couldn't decrypt. ${JSON.stringify(
        {
          fullMessage: base64Encode(fullMessage),
          message: base64Encode(message),
          nonce: base64Encode(nonce),
          senderPublicKey: base64Encode(senderPublicKey),
        },
        null,
        2,
      )}`,
    );
  }

  return decrypted;
};

export function hashText(credentialContent: string) {
  const encodedContent = new TextEncoder().encode(credentialContent);
  return hexEncodeSha256Hash(encodedContent);
}
