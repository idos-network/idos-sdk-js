import nacl from "tweetnacl";
import { describe, expect, it } from "vitest";
import { base64Encode } from "../codecs/index.js";
import { encryptContent, generatePassword, NoncedBox } from "./index.js";

describe("generatePassword", () => {
  it("generates a password", () => {
    const password = generatePassword();
    expect(password).toBeDefined();
    expect(password.length).toBe(20);

    // generate different passwords
    const password2 = generatePassword();
    const password3 = generatePassword();
    expect(password2).not.toBe(password);
    expect(password3).not.toBe(password);
    expect(password3).not.toBe(password2);
    expect(password).toMatch(/^[a-zA-Z0-9!@#$%^&*()_+\-=[\]{}|;:,.<>?]+$/);
  });
});

describe("cryptography", () => {
  const helloMessage = new Uint8Array([104, 101, 108, 108, 111]);
  const secretMessage = new Uint8Array([115, 101, 99, 114, 101, 116]);

  it("encryptContent encrypts and can be opened with nacl.box.open", () => {
    const sender = nacl.box.keyPair();
    const recipient = nacl.box.keyPair();

    const fullMessage = encryptContent(helloMessage, recipient.publicKey, sender.secretKey);

    const nonce = fullMessage.slice(0, nacl.box.nonceLength);
    const encrypted = fullMessage.slice(nacl.box.nonceLength);
    const opened = nacl.box.open(encrypted, nonce, sender.publicKey, recipient.secretKey);

    expect(fullMessage.length).toBeGreaterThan(nacl.box.nonceLength);
    expect(opened).not.toBeNull();
    expect(opened).toEqual(helloMessage);
  });

  it("NoncedBox.decrypt returns plaintext for valid inputs", async () => {
    const sender = nacl.box.keyPair();
    const recipient = nacl.box.keyPair();
    const fullMessage = encryptContent(secretMessage, recipient.publicKey, sender.secretKey);
    const box = new NoncedBox(recipient);
    const plaintext = await box.decrypt(base64Encode(fullMessage), base64Encode(sender.publicKey));

    expect(plaintext).toBe("secret");
  });

  it("NoncedBox.decrypt throws with wrong sender public key", async () => {
    const sender = nacl.box.keyPair();
    const recipient = nacl.box.keyPair();
    const attacker = nacl.box.keyPair();
    const fullMessage = encryptContent(secretMessage, recipient.publicKey, sender.secretKey);
    const box = new NoncedBox(recipient);

    await expect(
      box.decrypt(base64Encode(fullMessage), base64Encode(attacker.publicKey)),
    ).rejects.toThrow();
  });

  it("nonceFromBase64SecretKey creates a usable box", async () => {
    const sender = nacl.box.keyPair();
    const recipient = nacl.box.keyPair();
    const fullMessage = encryptContent(helloMessage, recipient.publicKey, sender.secretKey);
    const box = NoncedBox.nonceFromBase64SecretKey(base64Encode(recipient.secretKey));
    const plaintext = await box.decrypt(base64Encode(fullMessage), base64Encode(sender.publicKey));

    expect(plaintext).toBe("hello");
  });
});
