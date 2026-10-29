import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createActor, toPromise } from "xstate";

import { clearFaceSignProvider } from "@/core/signers";

import { disconnect } from "./disconnect-wallet";

vi.mock("@/core/signers", () => ({ clearFaceSignProvider: vi.fn(async () => {}) }));
vi.mock("@/core/wagmi", () => ({ disconnectEvm: vi.fn(async () => {}) }));
vi.mock("@/query-client", () => ({ queryClient: { clear: vi.fn() } }));

function runDisconnect(walletType: string) {
  const actor = createActor(disconnect, {
    input: { walletType, nearSelector: null, idOSClient: null } as never,
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
  });

  it("wipes FaceSign keys even when the session used another wallet", async () => {
    await runDisconnect("EVM");

    expect(clearFaceSignProvider).toHaveBeenCalledOnce();
  });

  it("fails closed when the FaceSign wipe fails", async () => {
    vi.mocked(clearFaceSignProvider).mockRejectedValueOnce(new Error("timed out"));

    await expect(runDisconnect("EVM")).rejects.toThrow("Failed to clear FaceSign keys");
  });
});
