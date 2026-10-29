import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createActor, toPromise } from "xstate";

import { clearFaceSignProvider } from "@/core/signers";
import { queryClient } from "@/query-client";

import { disconnect } from "./disconnect-wallet";

vi.mock("@/core/signers", () => ({ clearFaceSignProvider: vi.fn(async () => {}) }));
vi.mock("@/core/wagmi", () => ({ disconnectEvm: vi.fn(async () => {}) }));
vi.mock("@/query-client", () => ({ queryClient: { clear: vi.fn() } }));

function runDisconnect(walletType: string, idOSClient: unknown = null) {
  const actor = createActor(disconnect, {
    input: { walletType, nearSelector: null, idOSClient } as never,
  }).start();
  return toPromise(actor);
}

describe("disconnect", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(null, { status: 200 })),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.mocked(clearFaceSignProvider).mockReset();
    vi.mocked(queryClient.clear).mockReset();
  });

  it("wipes FaceSign keys even when the session used another wallet", async () => {
    await runDisconnect("EVM");

    expect(clearFaceSignProvider).toHaveBeenCalledOnce();
  });

  it("fails closed when the FaceSign wipe fails, after logging the client out", async () => {
    vi.mocked(clearFaceSignProvider).mockRejectedValueOnce(new Error("timed out"));
    const logOut = vi.fn(async () => {
      throw new Error("Embedding pages cannot reset enclave storage");
    });

    await expect(runDisconnect("EVM", { state: "logged-in", logOut })).rejects.toThrow(
      "Failed to clear FaceSign keys",
    );
    expect(logOut).toHaveBeenCalledOnce();
    expect(queryClient.clear).toHaveBeenCalledOnce();
  });
});
