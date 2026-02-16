import { base64Decode } from "@idos-network/utils/codecs";
import { MemoryStore } from "@idos-network/utils/store";
import { describe, expect, it } from "vitest";
import { LocalEnclave, type LocalEnclaveOptions } from "./local.js";

class TestEnclave extends LocalEnclave {
  async getPasswordContext() {
    return {
      encryptionPasswordStore: "user",
      password: "super-secret",
      duration: 1,
    } as const;
  }
}

describe("LocalEnclave", () => {
  const userId = "9f51b3b2-4cbe-4c2b-8ea3-0b0c1b2f1a11";

  it("creates and exposes a public encryption profile", async () => {
    const store = new MemoryStore();
    const enclave = new TestEnclave({ userId, store } as LocalEnclaveOptions);

    const profile = await enclave.createEncryptionProfileFromPassword(
      "super-secret",
      userId,
      "user",
    );

    expect(profile.userId).toBe(userId);
    expect(profile.encryptionPasswordStore).toBe("user");

    const publicProfile = await enclave.ensureUserEncryptionProfile();
    const publicKeyBytes = base64Decode(publicProfile.userEncryptionPublicKey);

    expect(publicProfile.userId).toBe(userId);
    expect(publicProfile.encryptionPasswordStore).toBe("user");
    expect(publicKeyBytes).toHaveLength(32);
  });

  it("encrypts and decrypts with its keypair", async () => {
    const store = new MemoryStore();
    const enclave = new TestEnclave({ userId, store } as LocalEnclaveOptions);
    const { keyPair } = await enclave.getPrivateEncryptionProfile();

    const message = new Uint8Array([1, 2, 3, 4]);
    const { content, encryptorPublicKey } = await enclave.encrypt(message, keyPair.publicKey);
    const decrypted = await enclave.decrypt(content, encryptorPublicKey);

    expect(decrypted).toEqual(message);
  });
});
