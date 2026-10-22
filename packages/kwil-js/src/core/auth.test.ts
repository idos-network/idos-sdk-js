import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Auth } from "../auth/auth";
import { KGWAuthInfo, composeAuthMsg, verifyAuthProperties } from "../core/auth";
import { bytesToHex, stringToBytes } from "../utils/serial";
import { EnvironmentType } from "./enums";
import { KwilSigner } from "./kwilSigner";

describe("composeAuthMsg", () => {
  const baseParams: KGWAuthInfo = {
    nonce: "123456",
    statement: "eww",
    issue_at: "2023-11-05T22:57:46Z",
    expiration_time: "2023-11-05T22:58:16Z",
    chain_id: "test-chain",
    domain: "https://example.com",
    version: "1",
    uri: "https://example.com/auth",
  };

  it("omits Origin when KGW does not send it", () => {
    const msg = composeAuthMsg(baseParams, "https://example.com", "1", "test-chain");

    expect(msg).toEqual(
      "https://example.com wants you to sign in with your account:\n\neww\n\nURI: https://example.com/auth\nVersion: 1\nChain ID: test-chain\nNonce: 123456\nIssue At: 2023-11-05T22:57:46Z\nExpiration Time: 2023-11-05T22:58:16Z\n",
    );
    expect(bytesToHex(stringToBytes(msg))).toEqual(
      "68747470733a2f2f6578616d706c652e636f6d2077616e747320796f7520746f207369676e20696e207769746820796f7572206163636f756e743a0a0a6577770a0a5552493a2068747470733a2f2f6578616d706c652e636f6d2f617574680a56657273696f6e3a20310a436861696e2049443a20746573742d636861696e0a4e6f6e63653a203132333435360a49737375652041743a20323032332d31312d30355432323a35373a34365a0a45787069726174696f6e2054696d653a20323032332d31312d30355432323a35383a31365a0a",
    );
  });

  it("inserts Origin after URI when KGW sends it", () => {
    const msg = composeAuthMsg(
      { ...baseParams, origin: "https://app.example" },
      "https://example.com",
      "1",
      "test-chain",
    );

    expect(msg).toEqual(
      "https://example.com wants you to sign in with your account:\n\neww\n\nURI: https://example.com/auth\nOrigin: https://app.example\nVersion: 1\nChain ID: test-chain\nNonce: 123456\nIssue At: 2023-11-05T22:57:46Z\nExpiration Time: 2023-11-05T22:58:16Z\n",
    );
  });

  it("omits Origin when KGW sends an empty origin", () => {
    const msg = composeAuthMsg(
      { ...baseParams, origin: "" },
      "https://example.com",
      "1",
      "test-chain",
    );

    expect(msg).toEqual(
      "https://example.com wants you to sign in with your account:\n\neww\n\nURI: https://example.com/auth\nVersion: 1\nChain ID: test-chain\nNonce: 123456\nIssue At: 2023-11-05T22:57:46Z\nExpiration Time: 2023-11-05T22:58:16Z\n",
    );
  });
});

describe("verifyAuthProperties", () => {
  const domain = "https://example.com";
  const version = "1";
  const chainId = "test-chain";

  function valid(overrides: Partial<KGWAuthInfo> = {}): KGWAuthInfo {
    return {
      nonce: "123456",
      statement: "eww",
      issue_at: "2023-11-05T22:57:46Z",
      expiration_time: "2023-11-05T22:58:16Z",
      chain_id: chainId,
      domain,
      version,
      uri: `${domain}/rpc/v1`,
      ...overrides,
    };
  }

  function without(field: "domain" | "version" | "chain_id" | "uri"): KGWAuthInfo {
    const params: Partial<KGWAuthInfo> = valid();
    delete params[field];
    return params as KGWAuthInfo;
  }

  describe("node", () => {
    beforeEach(() => {
      vi.unstubAllGlobals();
    });

    it.each(["domain", "version", "chain_id"] as const)("rejects an empty %s", (field) => {
      expect(() => verifyAuthProperties(valid({ [field]: "" }), domain, version, chainId)).toThrow(
        /mismatch/,
      );
    });

    it.each(["domain", "version", "chain_id"] as const)("rejects a missing %s", (field) => {
      expect(() => verifyAuthProperties(without(field), domain, version, chainId)).toThrow(
        /mismatch/,
      );
    });

    it.each(["domain", "version", "chain_id"] as const)("rejects a null %s", (field) => {
      expect(() =>
        verifyAuthProperties(
          valid({ [field]: null as unknown as string }),
          domain,
          version,
          chainId,
        ),
      ).toThrow(/mismatch/);
    });

    it("rejects a different domain, version, or chain id", () => {
      expect(() =>
        verifyAuthProperties(valid({ domain: "https://evil.example" }), domain, version, chainId),
      ).toThrow(/Domain mismatch/);
      expect(() => verifyAuthProperties(valid({ version: "2" }), domain, version, chainId)).toThrow(
        /Version mismatch/,
      );
      expect(() =>
        verifyAuthProperties(valid({ chain_id: "other-chain" }), domain, version, chainId),
      ).toThrow(/Chain ID mismatch/);
    });

    it.each(["", "https://example.com/auth", "https://evil.example/rpc/v1"])(
      "rejects uri %j",
      (uri) => {
        expect(() => verifyAuthProperties(valid({ uri }), domain, version, chainId)).toThrow(
          /URI mismatch/,
        );
      },
    );

    it("rejects a missing uri", () => {
      expect(() => verifyAuthProperties(without("uri"), domain, version, chainId)).toThrow(
        /URI mismatch/,
      );
    });

    it("accepts the rpc uri when domain, version, and chain id match", () => {
      expect(() => verifyAuthProperties(valid(), domain, version, chainId)).not.toThrow();
    });

    it("rejects a non-empty origin", () => {
      expect(() =>
        verifyAuthProperties(valid({ origin: "https://app.example" }), domain, version, chainId),
      ).toThrow(/Origin mismatch/);
    });

    it("accepts a missing or empty origin", () => {
      expect(() => verifyAuthProperties(valid(), domain, version, chainId)).not.toThrow();
      expect(() =>
        verifyAuthProperties(valid({ origin: "" }), domain, version, chainId),
      ).not.toThrow();
    });

    it("does not sign when the uri is wrong", async () => {
      const sign = vi.fn(async () => new Uint8Array([1]));
      const auth = new Auth<EnvironmentType.NODE>(
        {
          async getAuthenticateClient() {
            return { status: 200, data: valid({ uri: "https://example.com/auth" }) };
          },
          async postAuthenticateClient() {
            throw new Error("posted");
          },
          async logoutClient() {
            throw new Error("logout");
          },
          async challengeClient() {
            throw new Error("challenge");
          },
        },
        domain,
        chainId,
      );

      await expect(
        auth.authenticateKGW(new KwilSigner(sign, new Uint8Array([2]), "ed25519")),
      ).rejects.toThrow(/URI mismatch/);
      expect(sign).not.toHaveBeenCalled();
    });
  });

  describe("browser", () => {
    beforeEach(() => {
      vi.stubGlobal("window", { location: { origin: "https://app.example" } });
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it("rejects a foreign or empty origin", () => {
      expect(() =>
        verifyAuthProperties(valid({ origin: "https://evil.example" }), domain, version, chainId),
      ).toThrow(/Origin mismatch/);
      expect(() => verifyAuthProperties(valid({ origin: "" }), domain, version, chainId)).toThrow(
        /Origin mismatch/,
      );
    });

    it("accepts the page origin", () => {
      expect(() =>
        verifyAuthProperties(valid({ origin: "https://app.example" }), domain, version, chainId),
      ).not.toThrow();
    });

    it("accepts a canonical mixed-case origin with a port", () => {
      vi.stubGlobal("window", { location: { origin: "https://app.example:8443" } });

      expect(() =>
        verifyAuthProperties(
          valid({ origin: "https://App.Example:8443" }),
          domain,
          version,
          chainId,
        ),
      ).not.toThrow();
    });
  });
});
