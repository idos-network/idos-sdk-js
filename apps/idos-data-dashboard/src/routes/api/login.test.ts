import { verifySignature } from "@idos-network/kwil-infra/signature-verification";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getDb } from "@/core/db.server";
import { createJsonRequest, getSetCookieHeader } from "@/test/helpers";

import { action, loader } from "./login";

vi.mock("@/core/db.server");
vi.mock("@idos-network/kwil-infra/signature-verification");

const mockGetDb = vi.mocked(getDb);
const mockVerifySignature = vi.mocked(verifySignature);

const evmProfile = {
  recipientEncryptionPublicKey: "recipient-key",
  encryptionPasswordStore: "user" as const,
  walletAddress: "0x1234567890123456789012345678901234567890",
  walletType: "EVM" as const,
  walletPublicKey: "0xabcdef",
  signature: "0xsig",
};

function loaderArgs(request = new Request("http://localhost/api/login")) {
  return { request } as Parameters<typeof loader>[0];
}

function actionArgs(request: Request) {
  return { request } as Parameters<typeof action>[0];
}

describe("/api/login", () => {
  const mockUpsert = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetDb.mockReturnValue({
      user: { upsert: mockUpsert },
    } as unknown as ReturnType<typeof getDb>);
  });

  describe("loader", () => {
    it("returns a proof message and stores it in the session cookie", async () => {
      const response = await loader(loaderArgs());
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.proofMessage).toMatch(
        /^Please sign this message to confirm you own this wallet address\. Nonce [0-9a-f-]{36}$/,
      );
      expect(getSetCookieHeader(response)).toContain("__session=");
    });
  });

  describe("action", () => {
    it("rejects non-POST requests", async () => {
      const response = await action(
        actionArgs(new Request("http://localhost/api/login", { method: "GET" })),
      );

      expect(response.status).toBe(405);
      await expect(response.json()).resolves.toEqual({ error: "Method not allowed" });
    });

    it("rejects invalid profile payloads", async () => {
      const response = await action(
        actionArgs(
          createJsonRequest("http://localhost/api/login", {
            method: "POST",
            body: { walletAddress: "only-address" },
          }),
        ),
      );

      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({ error: "Invalid profile data" });
    });

    it("rejects login when the proof message is missing from the session", async () => {
      const response = await action(
        actionArgs(
          createJsonRequest("http://localhost/api/login", {
            method: "POST",
            body: evmProfile,
          }),
        ),
      );

      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({ error: "Proof message not found" });
      expect(mockVerifySignature).not.toHaveBeenCalled();
    });

    it("rejects login when signature verification fails", async () => {
      const challengeResponse = await loader(loaderArgs());
      const challenge = await challengeResponse.json();

      mockVerifySignature.mockResolvedValue(false);

      const response = await action(
        actionArgs(
          createJsonRequest("http://localhost/api/login", {
            method: "POST",
            // cspell:disable-next-line
            body: { ...evmProfile, signature: "0xinvalid" },
            headers: {
              Cookie: getSetCookieHeader(challengeResponse),
            },
          }),
        ),
      );

      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({ error: "Invalid signature" });
      expect(mockVerifySignature).toHaveBeenCalledWith({
        address: evmProfile.walletAddress,
        message: challenge.proofMessage,
        // cspell:disable-next-line
        signature: "0xinvalid",
        wallet_type: evmProfile.walletType,
        public_key: [evmProfile.walletPublicKey],
      });
    });

    it("creates an EVM session after a valid signature", async () => {
      const challengeResponse = await loader(loaderArgs());
      const user = { id: "user-123" };

      mockVerifySignature.mockResolvedValue(true);
      mockUpsert.mockResolvedValue(user);

      const response = await action(
        actionArgs(
          createJsonRequest("http://localhost/api/login", {
            method: "POST",
            body: evmProfile,
            headers: {
              Cookie: getSetCookieHeader(challengeResponse),
            },
          }),
        ),
      );

      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual({ loggedIn: true });
      expect(mockUpsert).toHaveBeenCalledWith({
        where: {
          walletAddress_walletType: {
            walletAddress: evmProfile.walletAddress,
            walletType: evmProfile.walletType,
          },
        },
        update: {},
        create: {
          walletAddress: evmProfile.walletAddress,
          walletType: evmProfile.walletType,
        },
      });
      expect(getSetCookieHeader(response)).toContain("__session=");
    });

    it("creates a non-EVM session using the wallet public key", async () => {
      const challengeResponse = await loader(loaderArgs());
      const nearProfile = {
        recipientEncryptionPublicKey: "recipient-key",
        encryptionPasswordStore: "user" as const,
        walletAddress: "near-wallet.testnet",
        walletType: "NEAR" as const,
        walletPublicKey: "ed25519:NearPublicKey",
        signature: "0xsig",
      };
      const user = { id: "near-user-456" };

      mockVerifySignature.mockResolvedValue(true);
      mockUpsert.mockResolvedValue(user);

      const response = await action(
        actionArgs(
          createJsonRequest("http://localhost/api/login", {
            method: "POST",
            body: nearProfile,
            headers: {
              Cookie: getSetCookieHeader(challengeResponse),
            },
          }),
        ),
      );

      expect(response.status).toBe(200);
      expect(mockUpsert).toHaveBeenCalledWith({
        where: {
          walletPublicKey_walletType: {
            walletPublicKey: nearProfile.walletPublicKey,
            walletType: nearProfile.walletType,
          },
        },
        update: {},
        create: {
          walletType: nearProfile.walletType,
          walletPublicKey: nearProfile.walletPublicKey,
        },
      });
    });

    it("does not select a non-EVM developer row by the claimed wallet address", async () => {
      const challengeResponse = await loader(loaderArgs());
      const victimWalletAddress = "victim-self-owned-wallet-address";
      const attackerWalletPublicKey = "ed25519:attackerPublicKey";
      const profile = {
        recipientEncryptionPublicKey: "recipient-key",
        encryptionPasswordStore: "user" as const,
        walletAddress: victimWalletAddress,
        walletType: "NEAR" as const,
        walletPublicKey: attackerWalletPublicKey,
        // cspell:disable-next-line
        signature: "0xattacker-sig",
      };

      mockVerifySignature.mockResolvedValue(true);
      mockUpsert.mockResolvedValue({ id: "attacker-key-user" });

      const response = await action(
        actionArgs(
          createJsonRequest("http://localhost/api/login", {
            method: "POST",
            body: profile,
            headers: {
              Cookie: getSetCookieHeader(challengeResponse),
            },
          }),
        ),
      );

      expect(response.status).toBe(200);
      expect(mockUpsert).toHaveBeenCalledWith({
        where: {
          walletPublicKey_walletType: {
            walletPublicKey: attackerWalletPublicKey,
            walletType: profile.walletType,
          },
        },
        update: {},
        create: {
          walletType: profile.walletType,
          walletPublicKey: attackerWalletPublicKey,
        },
      });
      expect(mockUpsert).not.toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            walletAddress_walletType: expect.anything(),
          }),
        }),
      );
    });
  });
});
