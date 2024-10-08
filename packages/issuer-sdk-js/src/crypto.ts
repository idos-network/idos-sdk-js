import * as base64 from "@stablelib/base64";
import * as utf8Codec from "@stablelib/utf8";
import nacl from "tweetnacl";

export async function encrypt(message: string, encryptionPublicKey: string, secretKey: string) {
  const nonce = nacl.randomBytes(nacl.box.nonceLength);
  const encodedMsg = utf8Codec.encode(message);
  const decodedEncryptionPublicKey = base64.decode(encryptionPublicKey);
  const decodedSecretKey = base64.decode(secretKey);

  const encrypted = nacl.box(encodedMsg, nonce, decodedEncryptionPublicKey, decodedSecretKey);

  if (encrypted === null)
    throw Error(
      `Couldn't encrypt. ${JSON.stringify(
        {
          message: base64.encode(encodedMsg),
          nonce: base64.encode(nonce),
          receiverPublicKey: base64.encode(decodedEncryptionPublicKey),
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
