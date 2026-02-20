import type { idOSCredential } from "@idos-network/credentials/types";
import { base64Decode, base64Encode, utf8Encode } from "@idos-network/utils/codecs";
import { encryptContent } from "@idos-network/utils/cryptography";
import { MemoryStore } from "@idos-network/utils/store";
import tweetnacl from "tweetnacl";
import { describe, expect, it, vi } from "vitest";
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

  it("filters credentials and strips content", async () => {
    const store = new MemoryStore();
    const enclave = new TestEnclave({ userId, store });
    const { keyPair } = await enclave.getPrivateEncryptionProfile();

    // Reset enclave locals
    // @ts-expect-error This is fine, it's a custom method simulates the private encryption profile
    enclave.storedEncryptionProfile = undefined;

    const matches = { type: "kyc", level: "basic" };
    const misses = { type: "aml", level: "basic" };

    const ephemeralKeyPair = tweetnacl.box.keyPair();

    const matchesEncryption = encryptContent(
      utf8Encode(JSON.stringify(matches)),
      keyPair.publicKey,
      ephemeralKeyPair.secretKey,
    );
    const missesEncryption = encryptContent(
      utf8Encode(JSON.stringify(misses)),
      keyPair.publicKey,
      ephemeralKeyPair.secretKey,
    );

    const passwordContextSpy = vi.spyOn(enclave, "getPasswordContext");

    const credentials: idOSCredential[] = [
      {
        id: "cred-1",
        user_id: "user-1",
        public_notes: "{}",
        content: base64Encode(matchesEncryption),
        encryptor_public_key: base64Encode(ephemeralKeyPair.publicKey),
        issuer_auth_public_key: "issuer",
      },
      {
        id: "cred-2",
        user_id: "user-1",
        public_notes: "{}",
        content: base64Encode(missesEncryption),
        encryptor_public_key: base64Encode(ephemeralKeyPair.publicKey),
        issuer_auth_public_key: "issuer",
      },
    ];

    const filtered = await enclave.filterCredentials(credentials, {
      pick: { type: ["kyc"] },
      omit: {},
    });

    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.id).toBe("cred-1");
    expect(filtered[0]?.content).toBe("");
    expect(passwordContextSpy).toHaveBeenCalledTimes(1);
  });
});
