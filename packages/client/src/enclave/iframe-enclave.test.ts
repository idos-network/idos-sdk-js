// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";

import { IframeEnclave } from "./iframe-enclave";

describe("IframeEnclave.reset", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    document.body.replaceChildren();
  });

  it("rejects and closes the channel when the enclave never replies", async () => {
    vi.useFakeTimers();
    document.body.innerHTML = '<div id="enclave"></div>';
    const enclave = new IframeEnclave({
      container: "#enclave",
      url: "https://enclave.example",
    });
    const iframe = (enclave as unknown as { iframe: HTMLIFrameElement }).iframe;
    const closePort = vi.spyOn(MessagePort.prototype, "close");
    const contentWindow = {
      postMessage: () => {},
    };
    Object.defineProperty(iframe, "contentWindow", { value: contentWindow });

    const reset = enclave.reset();
    const rejected = expect(reset).rejects.toThrow("Enclave reset timed out");
    await vi.advanceTimersByTimeAsync(15_000);

    await rejected;
    expect(closePort).toHaveBeenCalled();
  });
});
