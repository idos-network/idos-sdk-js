import type { idOSClientLoggedIn } from "@idos-network/client";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createActor } from "xstate";

import { actors } from "./session";

const signMessageMock = vi.fn<(message: string) => Promise<string | Uint8Array | undefined>>();

const mockIdOSClient = {
  walletIdentifier: "0x1234567890123456789012345678901234567890",
  walletType: "EVM",
  walletPublicKey: "0xabcdef",
  user: {
    recipient_encryption_public_key: "recipient-key",
    encryption_password_store: "user",
  },
  signer: {
    signMessage: signMessageMock,
  },
} as unknown as idOSClientLoggedIn;

type LoginSnapshot = {
  status: "active" | "done" | "error" | "stopped";
  output?: boolean;
  error?: unknown;
};

async function runLoginActor() {
  const actor = createActor(actors.login, { input: mockIdOSClient });

  try {
    return await new Promise<boolean>((resolve, reject) => {
      actor.subscribe({
        next(snapshot: LoginSnapshot) {
          if (snapshot.status === "done") {
            resolve(snapshot.output ?? false);
          }

          if (snapshot.status === "error") {
            reject(snapshot.error);
          }
        },
        error(error: unknown) {
          reject(error);
        },
      });
      actor.start();
    });
  } finally {
    actor.stop();
  }
}

describe("developer session login actor", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    signMessageMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("logs in by fetching a challenge, signing it, and posting the profile", async () => {
    const proofMessage =
      "Please sign this message to confirm you own this wallet address. Nonce test-nonce";
    const fetchMock = vi.mocked(fetch);

    fetchMock
      .mockResolvedValueOnce(
        Response.json({ proofMessage }, { headers: { "Set-Cookie": "__session=test" } }),
      )
      .mockResolvedValueOnce(Response.json({ loggedIn: true }));

    signMessageMock.mockResolvedValue("deadbeef");

    const result = await runLoginActor();

    expect(result).toBe(true);
    expect(fetchMock).toHaveBeenNthCalledWith(1, "/api/login");
    expect(fetchMock).toHaveBeenNthCalledWith(2, "/api/login", {
      method: "POST",
      body: JSON.stringify({
        recipientEncryptionPublicKey: mockIdOSClient.user.recipient_encryption_public_key,
        encryptionPasswordStore: mockIdOSClient.user.encryption_password_store,
        walletAddress: mockIdOSClient.walletIdentifier,
        walletPublicKey: mockIdOSClient.walletPublicKey,
        walletType: mockIdOSClient.walletType,
        signature: "0xdeadbeef",
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });
  });

  it("normalizes Uint8Array signatures to hex", async () => {
    const fetchMock = vi.mocked(fetch);

    fetchMock
      .mockResolvedValueOnce(Response.json({ proofMessage: "nonce" }))
      .mockResolvedValueOnce(Response.json({ loggedIn: true }));

    signMessageMock.mockResolvedValue(Uint8Array.from([0xde, 0xad, 0xbe, 0xef]));

    await runLoginActor();

    const loginCall = fetchMock.mock.calls[1];
    const body = JSON.parse(String(loginCall?.[1]?.body));

    expect(body.signature).toBe("DEADBEEF");
  });

  it("fails when the wallet cannot sign the challenge", async () => {
    const fetchMock = vi.mocked(fetch);

    fetchMock.mockResolvedValueOnce(Response.json({ proofMessage: "nonce" }));
    signMessageMock.mockResolvedValue(undefined);

    await expect(runLoginActor()).rejects.toMatchObject({ message: "Failed to sign message" });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
