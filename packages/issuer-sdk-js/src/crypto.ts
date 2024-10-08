import * as base64 from "@stablelib/base64";
import * as utf8Codec from "@stablelib/utf8";
import nacl from "tweetnacl";

export async function encrypt(message: string, encryptionPublicKey: string, secretKey: string) {
  const nonce = nacl.randomBytes(nacl.box.nonceLength);
  const encrypted = nacl.box(
    utf8Codec.encode(message),
    nonce,
    base64.decode(encryptionPublicKey),
    base64.decode(secretKey),
  );

  const fullMessage = new Uint8Array(nonce.length + encrypted.length);
  fullMessage.set(nonce, 0);
  fullMessage.set(encrypted, nonce.length);
  return base64.encode(fullMessage);
}
