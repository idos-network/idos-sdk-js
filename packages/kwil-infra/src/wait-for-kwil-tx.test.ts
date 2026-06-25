import { afterEach, describe, expect, it, vi } from "vitest";

import { waitForKwilTx } from "./wait-for-kwil-tx";

describe("waitForKwilTx", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("resolves when height > 0 and tx_result.code is 0", async () => {
    const txInfo = vi
      .fn()
      .mockResolvedValueOnce({ data: { height: 0, tx_result: { code: 0, log: "" } } })
      .mockResolvedValueOnce({
        data: { height: 42, tx_result: { code: 0, log: "success" } },
      });

    vi.useFakeTimers();
    const waitPromise = waitForKwilTx(txInfo, "0xabc", 5_000);
    await vi.runAllTimersAsync();

    await expect(waitPromise).resolves.toBeUndefined();
    expect(txInfo).toHaveBeenCalledTimes(2);
  });

  it("throws KwilTxFailedError when height > 0 and tx_result.code is non-zero", async () => {
    const txInfo = vi.fn().mockResolvedValue({
      data: { height: 10, tx_result: { code: 7, log: "action failed" } },
    });

    await expect(waitForKwilTx(txInfo, "0xdef", 5_000)).rejects.toMatchObject({
      name: "KwilTxFailedError",
      txHash: "0xdef",
      code: 7,
      log: "action failed",
      height: 10,
    });
    expect(txInfo).toHaveBeenCalledTimes(1);
  });

  it("retries transient txInfo errors until the tx is finalized", async () => {
    const txInfo = vi
      .fn()
      .mockRejectedValueOnce(new Error("not found"))
      .mockResolvedValueOnce({
        data: { height: 3, tx_result: { code: 0, log: "ok" } },
      });

    vi.useFakeTimers();
    const waitPromise = waitForKwilTx(txInfo, "0x123", 5_000);
    await vi.runAllTimersAsync();

    await expect(waitPromise).resolves.toBeUndefined();
    expect(txInfo).toHaveBeenCalledTimes(2);
  });

  it("throws KwilTxPollTimeoutError when the deadline is exceeded", async () => {
    const txInfo = vi.fn().mockResolvedValue({
      data: { height: 0, tx_result: { code: 0, log: "" } },
    });

    vi.useFakeTimers();
    const waitPromise = waitForKwilTx(txInfo, "0x999", 1_000);
    const assertion = expect(waitPromise).rejects.toMatchObject({
      name: "KwilTxPollTimeoutError",
      txHash: "0x999",
      deadlineMs: 1_000,
    });
    await vi.runAllTimersAsync();

    await assertion;
    expect(txInfo.mock.calls.length).toBeGreaterThan(1);
  });
});
