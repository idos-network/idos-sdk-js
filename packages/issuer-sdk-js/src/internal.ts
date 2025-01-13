import { base64Encode } from "@idos-network/codecs";
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

export function encryptContent(message: Uint8Array, receiverPublicKey: Uint8Array): string {
  const nonce = nacl.randomBytes(nacl.box.nonceLength);
  const ephemeralKeyPair = nacl.box.keyPair();
  const encrypted = nacl.box(message, nonce, receiverPublicKey, ephemeralKeyPair.secretKey);

  if (encrypted === null)
    throw Error(
      `Couldn't encrypt. ${JSON.stringify(
        {
          message: base64Encode(message),
          nonce: base64Encode(nonce),
          receiverPublicKey: base64Encode(receiverPublicKey),
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
