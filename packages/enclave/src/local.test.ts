import type { idOSCredentialRecord as idOSCredential } from "@idos-network/credentials/types";

import { base64Decode, base64Encode, utf8Encode } from "@idos-network/utils/codecs";
import { encryptContent } from "@idos-network/utils/cryptography";
import { LocalStorageStore, MemoryStore } from "@idos-network/utils/store";
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

class TestEnclave extends LocalEnclave {
  userIdPresentOnPrompt: boolean[] = [];

  async getPasswordContext() {
    this.userIdPresentOnPrompt.push((await this.store.get(STORAGE_KEYS.USER_ID)) !== undefined);

    return {
      encryptionPasswordStore: "user",
      password: "super-secret",
      duration: 1,
    } as const;
  }
}

// `reset()` walks `Object.keys(storage)`. Methods stay on the prototype so only stored keys show up.
class SharedStorage {
  get length(): number {
    return Object.keys(this).length;
  }

  clear(): void {
    for (const key of Object.keys(this)) delete this[key as keyof this];
  }

  getItem(key: string): string | null {
    const value = this[key as keyof this];
    return typeof value === "string" ? value : null;
  }

  key(index: number): string | null {
    return Object.keys(this)[index] ?? null;
  }

  removeItem(key: string): void {
    delete this[key as keyof this];
  }

  setItem(key: string, value: string): void {
    Object.assign(this, { [key]: String(value) });
  }
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

  it("wipes a live cached profile once the canonical public key rotates", async () => {
    const store = new MemoryStore();
    const enclave = new TestEnclave({ userId, store } as LocalEnclaveOptions);
    const { keyPair } = await enclave.getPrivateEncryptionProfile();

    await enclave.reconfigure({ expectedUserEncryptionPublicKey: base64Encode(keyPair.publicKey) });
    expect((await enclave.getPrivateEncryptionProfile()).keyPair).toBe(keyPair);

    await enclave.reconfigure({
      expectedUserEncryptionPublicKey: base64Encode(new Uint8Array(32).fill(1)),
    });
    await expect(enclave.getPrivateEncryptionProfile()).rejects.toThrow(
      "Derived encryption public key does not match expectedUserEncryptionPublicKey",
    );
    // Rotation reset before re-entry: the second prompt found an empty store.
    expect(enclave.userIdPresentOnPrompt).toEqual([false, false]);
    expect(await store.get(STORAGE_KEYS.OBFUSCATED_BASE64_ENCRYPTION_SECRET_KEY)).toBeUndefined();
  });

  it("wipes a reloaded cached profile whose key no longer matches the canonical key", async () => {
    const store = new MemoryStore();
    await new TestEnclave({ userId, store } as LocalEnclaveOptions).getPrivateEncryptionProfile();

    const reloaded = new TestEnclave({
      userId,
      store,
      expectedUserEncryptionPublicKey: base64Encode(new Uint8Array(32).fill(1)),
    } as LocalEnclaveOptions);
    await reloaded.load();

    await expect(reloaded.encrypt(new Uint8Array([1]), new Uint8Array(32))).rejects.toThrow(
      "Derived encryption public key does not match expectedUserEncryptionPublicKey",
    );
    expect(reloaded.userIdPresentOnPrompt).toEqual([false]);
    expect(await store.get(STORAGE_KEYS.OBFUSCATED_BASE64_ENCRYPTION_SECRET_KEY)).toBeUndefined();
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

  it("forgets a loaded profile after another enclave removes the elapsed marker", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    const prefix = `idOS-expiry-${Math.random().toString(36).slice(2)}-`;
    const storage = new SharedStorage() as Storage;
    const store = new LocalStorageStore(storage, prefix);

    try {
      vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
      await new TestEnclave({ userId, store } as LocalEnclaveOptions).getPrivateEncryptionProfile();

      const live = new TestEnclave({ userId, store } as LocalEnclaveOptions);
      await live.load();
      const cached = await live.getPrivateEncryptionProfile();
      // Constructed while the marker is still in the future, so its startup check does not wipe.
      const other = new LocalStorageStore(storage, prefix);
      await other.checkRememberDurationElapsed();

      expect(live.userIdPresentOnPrompt).toEqual([]);

      vi.setSystemTime(new Date("2026-01-03T00:00:00Z"));
      // The marker is gone, the stored secret is not. Store expiry alone stays false.
      await other.delete(other.REMEMBER_DURATION_KEY);
      expect(await store.hasRememberDurationElapsed()).toBe(false);
      expect(await store.get(STORAGE_KEYS.USER_ID)).toBe(userId);

      const after = await live.getPrivateEncryptionProfile();

      expect(after).not.toBe(cached);
      expect(live.userIdPresentOnPrompt).toEqual([false]);
    } finally {
      await store.reset();
      vi.useRealTimers();
    }
  });

  it("forgets a loaded profile when another enclave resets before the duration elapses", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    const prefix = `idOS-expiry-${Math.random().toString(36).slice(2)}-`;
    const storage = new SharedStorage() as Storage;
    const store = new LocalStorageStore(storage, prefix);

    try {
      vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
      await new TestEnclave({ userId, store } as LocalEnclaveOptions).getPrivateEncryptionProfile();

      const live = new TestEnclave({ userId, store } as LocalEnclaveOptions);
      await live.load();
      const cached = await live.getPrivateEncryptionProfile();

      await new LocalStorageStore(storage, prefix).reset();

      const after = await live.getPrivateEncryptionProfile();

      expect(after).not.toBe(cached);
      expect(live.userIdPresentOnPrompt).toEqual([false]);
    } finally {
      await store.reset();
      vi.useRealTimers();
    }
  });
});
