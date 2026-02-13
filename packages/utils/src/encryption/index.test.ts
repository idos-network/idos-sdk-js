import nacl from "tweetnacl";
import { describe, expect, it } from "vitest";
import { base64Encode } from "../codecs/index.js";
import { decrypt, encrypt, keyDerivation } from "./index.js";

describe("encryption", () => {
  const helloMessage = new Uint8Array([104, 101, 108, 108, 111]);

  it("check key derivation from scrypt-js", async () => {
    const password = "correct horse battery staple";
    const salt = "9f51b3b2-4cbe-4c2b-8ea3-0b0c1b2f1a11";
    const expectedKey = "8iTwhZxrtQGKVV5OMthD5DxFc8c6B8h9MnU2Sh6JTTM=";

    const first = await keyDerivation(password, salt);

    expect(base64Encode(first)).toBe(expectedKey);
  });

  it("keyDerivation is deterministic for same inputs", async () => {
    const password = "correct horse battery staple";
    const salt = "9f51b3b2-4cbe-4c2b-8ea3-0b0c1b2f1a11";

    const first = await keyDerivation(password, salt);
    const second = await keyDerivation(password, salt);

    expect(base64Encode(first)).toBe(base64Encode(second));
  });

  it("keyDerivation rejects invalid salt", async () => {
    await expect(keyDerivation("password", "not-a-uuid")).rejects.toThrow("Invalid salt");
  });

  it("encrypt and decrypt roundtrip", async () => {
    const sender = nacl.box.keyPair();
    const receiver = nacl.box.keyPair();
    const { content, encryptorPublicKey } = encrypt(
      helloMessage,
      sender.publicKey,
      receiver.publicKey,
    );
    const decrypted = await decrypt(content, receiver, encryptorPublicKey);

    expect(decrypted).toEqual(helloMessage);
  });

  it("decrypt throws with wrong sender public key", async () => {
    const sender = nacl.box.keyPair();
    const receiver = nacl.box.keyPair();
    const attacker = nacl.box.keyPair();
    const { content } = encrypt(helloMessage, sender.publicKey, receiver.publicKey);

    await expect(decrypt(content, receiver, attacker.publicKey)).rejects.toThrow();
  });

  it("encrypt prepends nonce", () => {
    const sender = nacl.box.keyPair();
    const receiver = nacl.box.keyPair();
    const { content } = encrypt(helloMessage, sender.publicKey, receiver.publicKey);
    const nonce = content.slice(0, nacl.box.nonceLength);
    const encrypted = content.slice(nacl.box.nonceLength);

    expect(nonce).toHaveLength(nacl.box.nonceLength);
    expect(encrypted.length).toBeGreaterThan(0);
  });
});
