// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";

import { FaceSignSignerProvider } from "./facesign-signer";

const ENCLAVE_ORIGIN = "https://facesign.example";

function provider() {
  return new FaceSignSignerProvider({
    metadata: { name: "idOS Dashboard", description: "FaceSign signer" },
    enclaveUrl: ENCLAVE_ORIGIN,
  });
}

function iframeWindow(): Window {
  const iframe = document.querySelector("iframe");
  if (!iframe?.contentWindow) {
    throw new Error("FaceSign iframe did not load");
  }
  return iframe.contentWindow;
}

describe("FaceSignSignerProvider.reset", () => {
  afterEach(() => {
    vi.useRealTimers();
    document.body.replaceChildren();
  });

  it("asks the enclave to delete its key before tearing the iframe down", async () => {
    const signer = provider();
    const posted: unknown[] = [];
    const reset = signer.reset();

    await vi.waitFor(() => {
      expect(document.querySelector("iframe")).not.toBeNull();
    });

    const contentWindow = iframeWindow();
    vi.spyOn(contentWindow, "postMessage").mockImplementation((message) => {
      posted.push(message);
    });

    window.dispatchEvent(
      new MessageEvent("message", {
        origin: ENCLAVE_ORIGIN,
        data: { type: "facesign_ready", hasKey: true },
      }),
    );

    await vi.waitFor(() => {
      expect(posted).toContainEqual({ type: "reset", data: { id: 1 } });
    });

    window.dispatchEvent(
      new MessageEvent("message", {
        origin: ENCLAVE_ORIGIN,
        data: { type: "reset_complete", data: { id: 1, ok: true } },
      }),
    );

    await reset;
    expect(document.querySelector("iframe")).toBeNull();
  });

  it("rejects within the reset deadline when the enclave never becomes ready", async () => {
    vi.useFakeTimers();
    const signer = provider();
    const reset = signer.reset();
    const rejected = expect(reset).rejects.toThrow("FaceSign enclave failed to load");

    await vi.advanceTimersByTimeAsync(15_000);

    await rejected;
    expect(document.querySelector("iframe")).toBeNull();
  });
});
