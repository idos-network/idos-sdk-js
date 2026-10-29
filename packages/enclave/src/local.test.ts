import type { idOSCredentialRecord as idOSCredential } from "@idos-network/credentials/types";

import { base64Decode, base64Encode, utf8Encode } from "@idos-network/utils/codecs";
import { encryptContent } from "@idos-network/utils/cryptography";
import { keyDerivation } from "@idos-network/utils/encryption";
import { MemoryStore } from "@idos-network/utils/store";
import tweetnacl from "tweetnacl";
import { describe, expect, it, vi } from "vitest";

import { STORAGE_KEYS } from "./keys.js";
import { LocalEnclave, type LocalEnclaveOptions } from "./local.js";

// ponytail: real scrypt (N=16384) runs on every obfuscated store read/write, which is
// several hundred ms per test and times out on CI. The codec only needs a deterministic
// key of the right length, not a real KDF.
vi.mock("scrypt-js", () => ({
  syncScrypt: (
    _password: Uint8Array,
    salt: Uint8Array,
    _n: number,
    _r: number,
    _p: number,
    dkLen: number,
  ) =>
    new Uint8Array(Array.from({ length: dkLen }, (_, index) => salt[index % salt.length] ^ index)),
}));

vi.mock("@idos-network/utils/encryption", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@idos-network/utils/encryption")>();

  return {
    ...actual,
    keyDerivation: vi.fn(
      async () => new Uint8Array(Array.from({ length: 32 }, (_, index) => index)),
    ),
  };
});

// Obfuscated store uses syncScrypt(N=16384); keep tests under vitest's default 5s timeout on CI.
vi.mock("scrypt-js", () => ({
  syncScrypt: vi.fn(
    (_password: Uint8Array, _salt: Uint8Array, _N: number, _r: number, _p: number, dkLen: number) =>
      new Uint8Array(dkLen).fill(7),
  ),
}));

// The enclave app's origin grants key, cleared the same way on profile replacement.
const ORIGIN_GRANTS_KEY = "enclave-authorized-origins-v2";

class TestEnclave extends LocalEnclave {
  userIdPresentOnPrompt: boolean[] = [];

  protected async onStoredProfileReplaced() {
    await this.store.delete(ORIGIN_GRANTS_KEY);
  }

  async getPasswordContext() {
    this.userIdPresentOnPrompt.push((await this.store.get(STORAGE_KEYS.USER_ID)) !== undefined);

    return {
      encryptionPasswordStore: "user",
      password: "super-secret",
      duration: 1,
    } as const;
  }
}

// Copy of every raw entry in the store, to check that nothing was deleted or overwritten.
function storedEntries(store: MemoryStore) {
  return new Map(store["storage"]);
}

class MPCTestEnclave extends LocalEnclave {
  mpcPassword = "super-secret";

  async getPasswordContext() {
    return {
      encryptionPasswordStore: "mpc",
    } as const;
  }

  protected async ensureMPCPassword() {
    return this.mpcPassword;
  }
}

describe("LocalEnclave", () => {
  const userId = "9f51b3b2-4cbe-4c2b-8ea3-0b0c1b2f1a11";

  it("rejects passwords whose derived public key does not match expectedUserEncryptionPublicKey", async () => {
    const store = new MemoryStore();
    const enclave = new TestEnclave({
      userId,
      store,
      expectedUserEncryptionPublicKey: base64Encode(new Uint8Array(32).fill(1)),
    } as LocalEnclaveOptions);

    await expect(
      enclave.createEncryptionProfileFromPassword("super-secret", userId, "user"),
    ).rejects.toThrow(
      "Derived encryption public key does not match expectedUserEncryptionPublicKey",
    );
  });

  it("accepts passwords whose derived public key matches expectedUserEncryptionPublicKey", async () => {
    const store = new MemoryStore();
    const enclave = new TestEnclave({ userId, store } as LocalEnclaveOptions);
    const { keyPair } = await enclave.createEncryptionProfileFromPassword(
      "super-secret",
      userId,
      "user",
    );

    const matchingEnclave = new TestEnclave({
      userId,
      store: new MemoryStore(),
      expectedUserEncryptionPublicKey: base64Encode(keyPair.publicKey),
    } as LocalEnclaveOptions);

    await expect(
      matchingEnclave.createEncryptionProfileFromPassword("super-secret", userId, "user"),
    ).resolves.toMatchObject({ userId, encryptionPasswordStore: "user" });
  });

  it("rejects MPC unlock when the downloaded password derives a mismatched public key", async () => {
    const store = new MemoryStore();
    const enclave = new MPCTestEnclave({
      userId,
      store,
      mode: "existing",
      expectedUserEncryptionPublicKey: base64Encode(new Uint8Array(32).fill(1)),
    } as LocalEnclaveOptions);

    await expect(enclave.getPrivateEncryptionProfile()).rejects.toThrow(
      "Derived encryption public key does not match expectedUserEncryptionPublicKey",
    );
  });

  it("requires origin authorization after deriving a key and keeps the profile if denied", async () => {
    const store = new MemoryStore();
    const enclave = new TestEnclave({ userId, store } as LocalEnclaveOptions);
    let allowed = false;
    const guard = vi.spyOn(enclave, "guardKeys").mockImplementation(async () => allowed);
    const passwordContextSpy = vi.spyOn(enclave, "getPasswordContext");

    await expect(enclave.getPrivateEncryptionProfile()).rejects.toThrow(
      "Origin is not authorized to use the keys",
    );
    expect(passwordContextSpy).toHaveBeenCalledTimes(1);
    expect(guard).toHaveBeenCalledTimes(1);

    allowed = true;
    const profile = await enclave.getPrivateEncryptionProfile();

    expect(profile.userId).toBe(userId);
    expect(passwordContextSpy).toHaveBeenCalledTimes(1);
    expect(guard).toHaveBeenCalledTimes(2);
  });

  it("does not check origin authorization when the guard is skipped", async () => {
    const enclave = new TestEnclave({ userId, store: new MemoryStore() } as LocalEnclaveOptions);
    const guard = vi.spyOn(enclave, "guardKeys");

    await enclave.getPrivateEncryptionProfile(true);

    expect(guard).not.toHaveBeenCalled();
  });

  it("does not request a password context for an MM profile without a stored key", async () => {
    const enclave = new TestEnclave({
      userId,
      store: new MemoryStore(),
      encryptionPasswordStore: "mm",
    });
    const passwordContextSpy = vi.spyOn(enclave, "getPasswordContext");

    await expect(enclave.getPrivateEncryptionProfile()).rejects.toThrow(
      "MM encryption profiles require an externally supplied encryption private key",
    );
    expect(passwordContextSpy).not.toHaveBeenCalled();
  });

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

  it("stops using a live cached profile once the canonical public key rotates", async () => {
    const store = new MemoryStore();
    const enclave = new TestEnclave({ userId, store } as LocalEnclaveOptions);
    const { keyPair } = await enclave.getPrivateEncryptionProfile();

    await enclave.reconfigure({ expectedUserEncryptionPublicKey: base64Encode(keyPair.publicKey) });
    expect((await enclave.getPrivateEncryptionProfile()).keyPair).toBe(keyPair);

    await enclave.reconfigure({
      expectedUserEncryptionPublicKey: base64Encode(new Uint8Array(32).fill(1)),
    });
    const before = storedEntries(store);
    await expect(enclave.getPrivateEncryptionProfile()).rejects.toThrow(
      "Derived encryption public key does not match expectedUserEncryptionPublicKey",
    );
    // The stale key is not used, but storage stays until an unlock replaces it.
    expect(enclave.userIdPresentOnPrompt).toEqual([false, true]);
    expect(storedEntries(store)).toEqual(before);
  });

  it("stops using a reloaded cached profile whose key no longer matches the canonical key", async () => {
    const store = new MemoryStore();
    await new TestEnclave({ userId, store } as LocalEnclaveOptions).getPrivateEncryptionProfile();
    const before = storedEntries(store);

    const reloaded = new TestEnclave({
      userId,
      store,
      expectedUserEncryptionPublicKey: base64Encode(new Uint8Array(32).fill(1)),
    } as LocalEnclaveOptions);
    await reloaded.load();

    await expect(reloaded.encrypt(new Uint8Array([1]), new Uint8Array(32))).rejects.toThrow(
      "Derived encryption public key does not match expectedUserEncryptionPublicKey",
    );
    expect(reloaded.userIdPresentOnPrompt).toEqual([true]);
    expect(storedEntries(store)).toEqual(before);
  });

  describe("when an unauthorized parent sends values that do not match the stored profile", () => {
    const otherUserId = "1c2d3e4f-5a6b-7c8d-9e0f-1a2b3c4d5e6f";
    const variants: [string, Partial<LocalEnclaveOptions>][] = [
      ["another userId", { userId: otherUserId }],
      [
        "another expectedUserEncryptionPublicKey",
        { expectedUserEncryptionPublicKey: base64Encode(new Uint8Array(32).fill(1)) },
      ],
    ];
    const calls: [string, (enclave: LocalEnclave) => Promise<unknown>][] = [
      ["ensureUserEncryptionProfile", (enclave) => enclave.ensureUserEncryptionProfile()],
      ["encrypt", (enclave) => enclave.encrypt(new Uint8Array([1]), new Uint8Array(32))],
      ["decrypt", (enclave) => enclave.decrypt(new Uint8Array([1]), new Uint8Array(32))],
    ];

    describe.each(variants)("with %s", (_, options) => {
      it.each(calls)("keeps every stored key through %s", async (_, call) => {
        const store = new MemoryStore();
        await new TestEnclave({
          userId,
          store,
        } as LocalEnclaveOptions).getPrivateEncryptionProfile();
        // Stands in for the enclave app's origin grants, which live in the same store.
        await store.set(ORIGIN_GRANTS_KEY, "{}");
        const before = storedEntries(store);

        const enclave = new TestEnclave({ store } as LocalEnclaveOptions);
        vi.spyOn(enclave, "guardKeys").mockResolvedValue(false);
        // The user never unlocks: whatever the parent sends must not touch storage.
        vi.spyOn(enclave, "getPasswordContext").mockRejectedValue(new Error("Unlock cancelled"));

        await enclave.load();
        await enclave.reconfigure(options);

        await expect(call(enclave)).rejects.toThrow();
        expect(storedEntries(store)).toEqual(before);
      });
    });

    it("replaces the stored profile once the other user unlocks", async () => {
      const store = new MemoryStore();
      await new TestEnclave({ userId, store } as LocalEnclaveOptions).getPrivateEncryptionProfile();

      const enclave = new TestEnclave({ store } as LocalEnclaveOptions);
      vi.spyOn(enclave, "guardKeys").mockResolvedValue(true);
      const replaced = vi.spyOn(
        enclave as unknown as { onStoredProfileReplaced(): Promise<void> },
        "onStoredProfileReplaced",
      );

      await enclave.load();
      await enclave.reconfigure({ userId: otherUserId });

      expect((await enclave.getPrivateEncryptionProfile()).userId).toBe(otherUserId);
      expect(await store.get(STORAGE_KEYS.USER_ID)).toBe(otherUserId);
      expect(replaced).toHaveBeenCalledTimes(1);
    });
  });

  it("forgets a cached profile after the remember duration elapses", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });

    try {
      vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));

      const store = new MemoryStore();
      const enclave = new TestEnclave({ userId, store } as LocalEnclaveOptions);
      const first = await enclave.getPrivateEncryptionProfile();

      expect(await enclave.getPrivateEncryptionProfile()).toBe(first);

      vi.setSystemTime(new Date("2026-01-03T00:00:00Z"));
      const after = await enclave.getPrivateEncryptionProfile();

      expect(after).not.toBe(first);
      expect(after.userId).toBe(userId);
      // First prompt finds an empty store. The second must too: expiry resets before re-entry.
      expect(enclave.userIdPresentOnPrompt).toEqual([false, false]);
    } finally {
      vi.useRealTimers();
    }
  });

  it("forgets a cached profile when another enclave resets the shared store", async () => {
    const store = new MemoryStore();
    const enclave = new TestEnclave({ userId, store } as LocalEnclaveOptions);
    const first = await enclave.getPrivateEncryptionProfile();

    await store.reset();

    expect(await enclave.getPrivateEncryptionProfile()).not.toBe(first);
    expect(enclave.userIdPresentOnPrompt).toEqual([false, false]);
  });

  it("forgets a cached MPC profile, which has no deadline, when the shared store is reset", async () => {
    const store = new MemoryStore();
    const enclave = new MPCTestEnclave({ userId, store } as LocalEnclaveOptions);
    const first = await enclave.getPrivateEncryptionProfile();

    expect(await enclave.getPrivateEncryptionProfile()).toBe(first);

    await store.reset();

    expect(await enclave.getPrivateEncryptionProfile()).not.toBe(first);
  });

  it("keeps a cached profile past its own deadline when another enclave extends it", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });

    try {
      vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
      const store = new MemoryStore();
      const enclave = new TestEnclave({ userId, store } as LocalEnclaveOptions);
      const first = await enclave.getPrivateEncryptionProfile();

      await store.setRememberDuration(30);
      vi.setSystemTime(new Date("2026-01-03T00:00:00Z"));

      expect(await enclave.getPrivateEncryptionProfile()).toBe(first);
      expect(enclave.userIdPresentOnPrompt).toEqual([false]);
    } finally {
      vi.useRealTimers();
    }
  });

  it("drops a cached profile without wiping another user's shared session", async () => {
    const store = new MemoryStore();
    const enclave = new TestEnclave({ userId, store } as LocalEnclaveOptions);
    const first = await enclave.getPrivateEncryptionProfile();

    await store.reset();
    const otherUserId = "1c2d3e4f-5a6b-7c8d-9e0f-1a2b3c4d5e6f";
    await new TestEnclave({
      userId: otherUserId,
      store,
    } as LocalEnclaveOptions).createEncryptionProfileFromPassword(
      "other-secret",
      otherUserId,
      "user",
    );

    expect(await enclave.getPrivateEncryptionProfile()).not.toBe(first);
    // The re-prompt still finds the other user's session: dropping the copy did not reset it.
    expect(enclave.userIdPresentOnPrompt).toEqual([false, true]);
  });

  it("does not return a cached profile that another enclave reset during the origin prompt", async () => {
    const store = new MemoryStore();
    const enclave = new TestEnclave({ userId, store } as LocalEnclaveOptions);
    const first = await enclave.getPrivateEncryptionProfile();
    vi.spyOn(enclave, "guardKeys")
      .mockImplementationOnce(async () => {
        await store.reset();
        return true;
      })
      .mockImplementation(async () => true);

    const after = await enclave.getPrivateEncryptionProfile();

    expect(after).not.toBe(first);
    expect(await store.get(STORAGE_KEYS.USER_ID)).toBe(userId);
    expect(enclave.userIdPresentOnPrompt).toEqual([false, false]);
  });

  it("does not return a cached profile for a user the parent switched to during the origin prompt", async () => {
    const store = new MemoryStore();
    const enclave = new TestEnclave({ userId, store } as LocalEnclaveOptions);
    const first = await enclave.getPrivateEncryptionProfile();
    const otherUserId = "1c2d3e4f-5a6b-7c8d-9e0f-1a2b3c4d5e6f";
    vi.spyOn(enclave, "guardKeys")
      .mockImplementationOnce(async () => {
        await enclave.reconfigure({ userId: otherUserId });
        return true;
      })
      .mockImplementation(async () => true);

    const after = await enclave.getPrivateEncryptionProfile();

    expect(after).not.toBe(first);
    expect(after.userId).toBe(otherUserId);
  });

  it("signals a profile replacement only when a different stored profile is overwritten", async () => {
    const store = new MemoryStore();
    const otherUserId = "1c2d3e4f-5a6b-7c8d-9e0f-1a2b3c4d5e6f";
    await new TestEnclave({
      userId: otherUserId,
      store,
    } as LocalEnclaveOptions).createEncryptionProfileFromPassword(
      "other-secret",
      otherUserId,
      "user",
    );
    const enclave = new TestEnclave({ userId, store } as LocalEnclaveOptions);
    const replaced = vi.spyOn(
      enclave as unknown as { onStoredProfileReplaced(): Promise<void> },
      "onStoredProfileReplaced",
    );

    await enclave.createEncryptionProfileFromPassword("super-secret", userId, "user");
    expect(replaced).toHaveBeenCalledTimes(1);

    await enclave.createEncryptionProfileFromPassword("super-secret", userId, "user");
    expect(replaced).toHaveBeenCalledTimes(1);
  });

  it("signals a replacement when a legacy profile without a stored public key gets a new key", async () => {
    const store = new MemoryStore();
    const enclave = new TestEnclave({ userId, store } as LocalEnclaveOptions);
    await enclave.createEncryptionProfileFromPassword("super-secret", userId, "user");
    await store.delete(STORAGE_KEYS.ENCRYPTION_PUBLIC_KEY);
    const replaced = vi.spyOn(
      enclave as unknown as { onStoredProfileReplaced(): Promise<void> },
      "onStoredProfileReplaced",
    );

    vi.mocked(keyDerivation).mockResolvedValueOnce(new Uint8Array(32).fill(9));
    await enclave.createEncryptionProfileFromPassword("other-secret", userId, "user");
    expect(replaced).toHaveBeenCalledTimes(1);
  });

  it("expires stored data even after a mismatch dropped the cached profile", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });

    try {
      vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
      const store = new MemoryStore();
      const enclave = new TestEnclave({ userId, store } as LocalEnclaveOptions);
      await enclave.getPrivateEncryptionProfile();

      await enclave.reconfigure({
        expectedUserEncryptionPublicKey: base64Encode(new Uint8Array(32).fill(1)),
      });
      await expect(enclave.getPrivateEncryptionProfile()).rejects.toThrow(
        "Derived encryption public key does not match expectedUserEncryptionPublicKey",
      );

      // MemoryStore wipes expired data on any read, but LocalStore does not: the enclave must reset.
      const reset = vi.spyOn(enclave, "reset");
      vi.setSystemTime(new Date("2026-01-03T00:00:00Z"));
      await expect(enclave.getPrivateEncryptionProfile()).rejects.toThrow(
        "Derived encryption public key does not match expectedUserEncryptionPublicKey",
      );
      expect(reset).toHaveBeenCalledTimes(1);
      // The last unlock found an empty store: the expired profile was wiped, not refreshed.
      expect(enclave.userIdPresentOnPrompt).toEqual([false, true, false]);
    } finally {
      vi.useRealTimers();
    }
  });

  it("expires stored data when the deadline passes during a rejected unlock", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });

    try {
      vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
      const store = new MemoryStore();
      const enclave = new TestEnclave({ userId, store } as LocalEnclaveOptions);
      await enclave.getPrivateEncryptionProfile();

      await enclave.reconfigure({
        expectedUserEncryptionPublicKey: base64Encode(new Uint8Array(32).fill(1)),
      });
      // The user is still on the prompt when the deadline passes.
      vi.spyOn(enclave, "getPasswordContext").mockImplementationOnce(async () => {
        vi.setSystemTime(new Date("2026-01-03T00:00:00Z"));
        return { encryptionPasswordStore: "user", password: "super-secret", duration: 1 };
      });

      await expect(enclave.getPrivateEncryptionProfile()).rejects.toThrow(
        "Derived encryption public key does not match expectedUserEncryptionPublicKey",
      );
      expect(storedEntries(store).size).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it("retries the replacement cleanup when it failed before the new profile was written", async () => {
    const store = new MemoryStore();
    await new TestEnclave({ userId, store } as LocalEnclaveOptions).getPrivateEncryptionProfile();
    const otherUserId = "1c2d3e4f-5a6b-7c8d-9e0f-1a2b3c4d5e6f";
    const enclave = new TestEnclave({ userId: otherUserId, store } as LocalEnclaveOptions);
    const replaced = vi
      .spyOn(
        enclave as unknown as { onStoredProfileReplaced(): Promise<void> },
        "onStoredProfileReplaced",
      )
      .mockRejectedValueOnce(new Error("Storage unavailable"));

    await expect(
      enclave.createEncryptionProfileFromPassword("other-secret", otherUserId, "user"),
    ).rejects.toThrow("Storage unavailable");
    expect(await store.get(STORAGE_KEYS.USER_ID)).toBe(userId);

    await enclave.createEncryptionProfileFromPassword("other-secret", otherUserId, "user");
    expect(replaced).toHaveBeenCalledTimes(2);
    expect(await store.get(STORAGE_KEYS.USER_ID)).toBe(otherUserId);
  });

  it("does not save an unlock under a user the parent switched to during the prompt", async () => {
    const store = new MemoryStore();
    await new TestEnclave({ userId, store } as LocalEnclaveOptions).getPrivateEncryptionProfile();
    await store.set(ORIGIN_GRANTS_KEY, "{}");
    const before = storedEntries(store);

    const otherUserId = "1c2d3e4f-5a6b-7c8d-9e0f-1a2b3c4d5e6f";
    const enclave = new TestEnclave({ store } as LocalEnclaveOptions);
    await enclave.load();
    await enclave.reconfigure({ userId: otherUserId });
    // The prompt is for the other user; the parent switches back before the password arrives.
    vi.spyOn(enclave, "getPasswordContext").mockImplementationOnce(async () => {
      await enclave.reconfigure({ userId });
      return { encryptionPasswordStore: "user", password: "super-secret", duration: 1 };
    });

    await expect(enclave.getPrivateEncryptionProfile()).rejects.toThrow(
      "User changed during unlock",
    );
    expect(storedEntries(store)).toEqual(before);
  });

  it("handles concurrent key use after the shared store is reset", async () => {
    const store = new MemoryStore();
    const enclave = new TestEnclave({ userId, store } as LocalEnclaveOptions);
    await enclave.getPrivateEncryptionProfile();

    await store.reset();
    const results = await Promise.all([
      enclave.getPrivateEncryptionProfile(),
      enclave.getPrivateEncryptionProfile(),
    ]);

    expect(results.map((profile) => profile.userId)).toEqual([userId, userId]);
  });
});
