// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";

import { FaceSignSignerProvider, resetStoredFaceSignKey } from "./facesign-signer";

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

describe("resetStoredFaceSignKey", () => {
  afterEach(() => {
    vi.useRealTimers();
    document.body.replaceChildren();
  });

  async function readyProvider(hasKey: boolean) {
    const signer = provider();
    const posted: unknown[] = [];
    const pending = resetStoredFaceSignKey(signer);

    await vi.waitFor(() => {
      expect(document.querySelector("iframe")).not.toBeNull();
    });

    vi.spyOn(iframeWindow(), "postMessage").mockImplementation((message) => {
      posted.push(message);
    });

    window.dispatchEvent(
      new MessageEvent("message", {
        origin: ENCLAVE_ORIGIN,
        data: { type: "facesign_ready", hasKey },
      }),
    );

    return { signer, posted, pending };
  }

  it("deletes a stored key and tears the provider down", async () => {
    const { posted, pending } = await readyProvider(true);

    await vi.waitFor(() => {
      expect(posted).toContainEqual({ type: "reset", data: { id: 1 } });
    });

    window.dispatchEvent(
      new MessageEvent("message", {
        origin: ENCLAVE_ORIGIN,
        data: { type: "reset_complete", data: { id: 1, ok: true } },
      }),
    );

    await expect(pending).resolves.toBe(true);
    expect(document.querySelector("iframe")).toBeNull();
  });

  it("leaves a provider with no stored key ready to scan", async () => {
    const { signer, posted, pending } = await readyProvider(false);

    await expect(pending).resolves.toBe(false);
    expect(posted).toEqual([]);
    expect(document.querySelector("iframe")).not.toBeNull();
    signer.destroy();
  });
});

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
