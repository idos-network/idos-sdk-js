// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";

import { IframeEnclave } from "./iframe-enclave";

describe("IframeEnclave.reset", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    document.body.replaceChildren();
  });

  it("asks the iframe to forget this origin instead of wiping storage", async () => {
    document.body.innerHTML = '<div id="enclave"></div>';
    const enclave = new IframeEnclave({
      container: "#enclave",
      url: "https://enclave.example",
    });
    const iframe = (enclave as unknown as { iframe: HTMLIFrameElement }).iframe;
    const postMessage = vi.fn((_message: unknown, _origin: string, [port]: MessagePort[]) =>
      port.postMessage({ result: undefined }),
    );
    Object.defineProperty(iframe, "contentWindow", { value: { postMessage } });

    await expect(enclave.reset()).resolves.toBeUndefined();
    expect(postMessage).toHaveBeenCalledOnce();
    expect(postMessage.mock.calls[0][0]).toEqual({ method: "forgetParentOrigin", data: [] });
  });
});
