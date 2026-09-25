// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";

import { IframeEnclave } from "./iframe-enclave";

describe("IframeEnclave.reset", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    document.body.replaceChildren();
  });

  it("resolves without asking the iframe to wipe storage", async () => {
    document.body.innerHTML = '<div id="enclave"></div>';
    const enclave = new IframeEnclave({
      container: "#enclave",
      url: "https://enclave.example",
    });
    const iframe = (enclave as unknown as { iframe: HTMLIFrameElement }).iframe;
    const postMessage = vi.fn();
    Object.defineProperty(iframe, "contentWindow", { value: { postMessage } });

    await expect(enclave.reset()).resolves.toBeUndefined();
    expect(postMessage).not.toHaveBeenCalled();
  });
});
