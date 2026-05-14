import { privateKeyToAccount } from "viem/accounts";
import { afterEach, describe, expect, it, vi } from "vitest";

import { verifyEvmSignature } from "./evm.js";

const account = privateKeyToAccount(
  "0x59c6995e998f97a5a0044966f0945381c9e109f760b1d2400b8f366da4d417fb",
);

describe("verifyEvmSignature", () => {
  afterEach(() => {
    vi.doUnmock("viem");
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("verifies a real EVM signature", async () => {
    const message = "hello";
    const signature = await account.signMessage({ message });
    const result = await verifyEvmSignature(message, signature, account.address);

    expect(result).toBe(true);
  });

  it("returns false when a real signature does not match the message", async () => {
    const signature = await account.signMessage({ message: "hello" });
    const result = await verifyEvmSignature("goodbye", signature, account.address);

    expect(result).toBe(false);
  });

  it("returns false when a signature is invalid", async () => {
    const result = await verifyEvmSignature("goodbye", "0xinvalidsignature", account.address);

    expect(result).toBe(false);
  });

  it("throws a clear error when viem cannot be loaded", async () => {
    vi.doMock("viem", () => {
      throw new Error("Cannot find module 'viem'");
    });

    const { verifyEvmSignature } = await import("./evm.js");

    await expect(verifyEvmSignature("hello", "0xsignature", "0xaddress")).rejects.toThrow(
      "Can't load viem",
    );
  });
});
