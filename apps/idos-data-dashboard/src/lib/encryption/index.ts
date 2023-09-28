import * as StableBase64 from "@stablelib/base64";
import * as StablelibUtf8 from "@stablelib/utf8";
import scrypt from "scrypt-js";
import nacl from "tweetnacl";

export const deriveKeyPairEnc = async (password: string, humanId?: string) => {
  const encoder = new TextEncoder();

  const normalizedPassword = encoder.encode(password.normalize("NFKC"));
  const salt = encoder.encode(humanId);

  const derivedKey = await scrypt.scrypt(normalizedPassword, salt, 1024, 8, 1, 32);

  return nacl.box.keyPair.fromSecretKey(derivedKey);
};

export const deriveKeyPairAuth = async (password: string) => {
  const encoder = new TextEncoder();

  const normalizedPassword = encoder.encode(password.normalize("NFKC"));
  const salt = encoder.encode("");

  const derivedKey = await scrypt.scrypt(normalizedPassword, salt, 1024, 8, 1, 32);

  return nacl.sign.keyPair.fromSeed(derivedKey);
};

export const encodeBase64 = (value: Uint8Array = new Uint8Array()) => {
  return StableBase64.encode(value);
};

export const decodeBase64 = (value = "") => {
  return StableBase64.decode(value);
};

export const encrypt = (message: string, pk: string, sk: string) => {
  const nonce = nacl.randomBytes(nacl.box.nonceLength);
  const stableMsg = StablelibUtf8.encode(message);

  const publicKey = decodeBase64(pk);
  const secretKey = decodeBase64(sk);

  const encrypted = nacl.box(stableMsg, nonce, publicKey, secretKey);

  const msg = new Uint8Array(nonce.length + encrypted.length);
  msg.set(nonce);
  msg.set(encrypted, nonce.length);

  return encodeBase64(msg);
};

export const decrypt = (ciphertext: string, pk: string, sk: string) => {
  const cipher = decodeBase64(ciphertext);
  const nonce = cipher.slice(0, nacl.box.nonceLength);

  const publicKey = decodeBase64(pk);
  const secretKey = decodeBase64(sk);

  const message = cipher.slice(nacl.box.nonceLength, ciphertext.length);

  const decrypted = nacl.box.open(message, nonce, publicKey, secretKey);

  if (decrypted === null) {
    throw new Error("Failed to decrypt the contents. Possibly a wrong password was used.");
  }

  return StablelibUtf8.decode(decrypted);
};
