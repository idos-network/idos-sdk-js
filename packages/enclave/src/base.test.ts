import type { idOSCredential } from "@idos-network/credentials/types";
import { base64Encode, utf8Encode } from "@idos-network/utils/codecs";
import { describe, expect, it, vi } from "vitest";
import { BaseProvider } from "./base.js";
import type { PublicEncryptionProfile } from "./types.js";

type TestOptions = { userId?: string };

class TestProvider extends BaseProvider<TestOptions> {
  async decrypt(message: Uint8Array): Promise<Uint8Array> {
    return message;
  }

  async ensureUserEncryptionProfile(): Promise<PublicEncryptionProfile> {
    return {
      userId: crypto.randomUUID(),
      userEncryptionPublicKey: base64Encode(new Uint8Array([1, 2, 3])),
      encryptionPasswordStore: "user",
    };
  }
}

describe("BaseProvider", () => {
  it("uses signTypedData when available", async () => {
    const provider = new TestProvider({ userId: "user" });
    const signTypedData = vi.fn().mockResolvedValue("sig");
    provider.setSigner({ signTypedData });

    const result = await provider.signTypedData({ domain: 1 }, { types: 2 }, { value: 3 });

    expect(result).toBe("sig");
    expect(signTypedData).toHaveBeenCalledWith({ domain: 1 }, { types: 2 }, { value: 3 });
  });

  it("falls back to signMessage and extracts signedMessage", async () => {
    const provider = new TestProvider({ userId: "user" });
    const signMessage = vi.fn().mockResolvedValue({ result: { signedMessage: "sig" } });
    provider.setSigner({ signMessage });

    const result = await provider.signTypedData({}, {}, { hello: "world" });

    expect(result).toBe("sig");
    expect(signMessage).toHaveBeenCalledWith(JSON.stringify({ hello: "world" }));
  });

  it("accepts signMessage string response", async () => {
    const provider = new TestProvider({ userId: "user" });
    const signMessage = vi.fn().mockResolvedValue("sig");
    provider.setSigner({ signMessage });

    await expect(provider.signTypedData({}, {}, { ok: true })).resolves.toBe("sig");
  });

  it("throws when signer is not set", async () => {
    const provider = new TestProvider({ userId: "user" });
    await expect(provider.signTypedData({}, {}, {})).rejects.toThrow("Signer is not set");
  });

  it("throws when no sign method is provided", () => {
    const provider = new TestProvider({ userId: "user" });
    expect(() => provider.setSigner({} as unknown as Record<string, never>)).toThrow(
      "No sign method found in passed signer",
    );
  });

  it("requires userId in options for userId getter", () => {
    const provider = new TestProvider({});
    expect(() => provider.userId).toThrow("User ID is not present");
  });

  it("filters credentials and strips content", async () => {
    const provider = new TestProvider({ userId: "user" });
    const publicKey = base64Encode(new Uint8Array([1, 2, 3]));

    const matches = { type: "kyc", level: "basic" };
    const misses = { type: "aml", level: "basic" };

    const credentials: idOSCredential[] = [
      {
        id: "cred-1",
        user_id: "user-1",
        public_notes: "{}",
        content: base64Encode(utf8Encode(JSON.stringify(matches))),
        encryptor_public_key: publicKey,
        issuer_auth_public_key: "issuer",
      },
      {
        id: "cred-2",
        user_id: "user-1",
        public_notes: "{}",
        content: base64Encode(utf8Encode(JSON.stringify(misses))),
        encryptor_public_key: publicKey,
        issuer_auth_public_key: "issuer",
      },
    ];

    const filtered = await provider.filterCredentials(credentials, {
      pick: { type: ["kyc"] },
      omit: {},
    });

    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.id).toBe("cred-1");
    expect(filtered[0]?.content).toBe("");
  });

  it("returns all credentials when no filters are provided", async () => {
    const provider = new TestProvider({ userId: "user" });
    const publicKey = base64Encode(new Uint8Array([1, 2, 3]));
    const credentials: idOSCredential[] = [
      {
        id: "cred-1",
        user_id: "user-1",
        public_notes: "{}",
        content: base64Encode(utf8Encode(JSON.stringify({ value: 1 }))),
        encryptor_public_key: publicKey,
        issuer_auth_public_key: "issuer",
      },
      {
        id: "cred-2",
        user_id: "user-1",
        public_notes: "{}",
        content: base64Encode(utf8Encode(JSON.stringify({ value: 2 }))),
        encryptor_public_key: publicKey,
        issuer_auth_public_key: "issuer",
      },
    ];

    const filtered = await provider.filterCredentials(credentials, { pick: {}, omit: {} });

    expect(filtered).toHaveLength(2);
    expect(filtered.every((credential) => credential.content === "")).toBe(true);
  });
});
