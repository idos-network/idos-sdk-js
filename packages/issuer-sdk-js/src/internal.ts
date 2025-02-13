import { base64Encode } from "@idos-network/codecs";
import { Utils } from "@kwilteam/kwil-js";
import nacl from "tweetnacl";

export function ensureEntityId<T extends { id?: string }>(entity: T): { id: string } & T {
  return {
    ...entity,
    id: entity.id ?? crypto.randomUUID(),
  };
}

// biome-ignore lint/suspicious/noExplicitAny: We don't need to be strict about types being passed in.
export function createActionInput(params: Record<string, any>): Utils.ActionInput {
  return createActionInputWithoutId(ensureEntityId(params));
}
// biome-ignore lint/suspicious/noExplicitAny: We don't need to be strict about types being passed in.
export function createActionInputWithoutId(params: Record<string, any>): Utils.ActionInput {
  const prefixedEntries = Object.entries(params).map(([key, value]) => [`$${key}`, value]);
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

export function decryptContent(
  message: Uint8Array,
  senderEncryptionPublicKey: Uint8Array,
  recipientEncryptionSecretKey: Uint8Array,
) {
  const nonce = message.slice(0, nacl.box.nonceLength);

  const decrypted = nacl.box.open(
    message.slice(nacl.box.nonceLength, message.length),
    nonce,
    senderEncryptionPublicKey,
    recipientEncryptionSecretKey,
  );

  if (decrypted === null) {
    throw Error(
      `Couldn't decrypt. ${JSON.stringify(
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
