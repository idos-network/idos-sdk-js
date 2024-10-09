import * as Base64Codec from "@stablelib/base64";
import * as Utf8Codec from "@stablelib/utf8";
import nacl from "tweetnacl";
import { describe, expect, it } from "vitest";
import { decrypt, encrypt } from "../crypto"; // Adjust the path to your encrypt file

const generateKeyPair = () => {
  const keyPair = nacl.box.keyPair();
  return {
    publicKey: keyPair.publicKey,
    secretKey: keyPair.secretKey,
  };
};

describe("Encryption and Decryption", () => {
  it("should encrypt and decrypt a message successfully", async () => {
    const sender = generateKeyPair();
    const recipient = generateKeyPair();

    const message = "Hello World!";

    const encryptedMessage = await encrypt(
      Utf8Codec.encode(message),
      recipient.publicKey,
      sender.secretKey,
    );

    expect(encryptedMessage).toBeTruthy();

    const decryptedMessage = await decrypt(
      Base64Codec.decode(encryptedMessage),
      sender.publicKey,
      recipient.secretKey,
    );

    expect(decryptedMessage).toBe(message);
  });

  it("should fail to decrypt if wrong keys are used", async () => {
    const sender = generateKeyPair();
    const recipient = generateKeyPair();
    const wrongRecipient = generateKeyPair();

    const message = "Test Message with Wrong Keys!";

    const encryptedMessage = await encrypt(
      Utf8Codec.encode(message),
      recipient.publicKey,
      sender.secretKey,
    );

    expect(encryptedMessage).toBeTruthy();

    try {
      await decrypt(
        Base64Codec.decode(encryptedMessage),
        sender.publicKey,
        wrongRecipient.secretKey,
      );
    } catch (error) {
      expect(error.message).toContain("Couldn't decrypt.");
    }
  });

  it("should handle empty messages correctly", async () => {
    const sender = generateKeyPair();
    const recipient = generateKeyPair();

    const emptyMessage = "";

    const encryptedMessage = await encrypt(
      Utf8Codec.encode(emptyMessage),
      recipient.publicKey,
      sender.secretKey,
    );

    expect(encryptedMessage).toBeTruthy();

    const decryptedMessage = await decrypt(
      Base64Codec.decode(encryptedMessage),
      sender.publicKey,
      recipient.secretKey,
    );

    expect(decryptedMessage).toBe(emptyMessage);
  });
});
