import { beforeEach, describe, expect, it, vi } from "vitest";

import { loader } from "./profile";

const { init, addWalletMessage } = vi.hoisted(() => {
  const addWalletMessage = vi.fn(async (params: { user_id: string; address: string }) => {
    return `msg:${params.user_id}`;
  });
  const init = vi.fn(async () => ({ addWalletMessage }));
  return { init, addWalletMessage };
});

vi.mock("@idos-network/issuer", () => ({
  idOSIssuer: { init },
}));

function loaderArgs(address = "0xabc", walletType = "EVM") {
  return {
    request: new Request(
      `http://localhost/api/profile?address=${address}&walletType=${walletType}`,
    ),
  } as Parameters<typeof loader>[0];
}

describe("/api/profile loader", () => {
  beforeEach(() => {
    init.mockReset();
    addWalletMessage.mockClear();
    init.mockImplementation(async () => ({ addWalletMessage }));
  });

  it("reuses one issuer and still challenges each request", async () => {
    init.mockRejectedValueOnce(new Error("node down"));
    await expect(loader(loaderArgs())).rejects.toThrow("node down");

    const first = await loader(loaderArgs("0xabc"));
    const second = await loader(loaderArgs("0xdef"));
    const firstBody = await first.json();
    const secondBody = await second.json();

    expect(init).toHaveBeenCalledTimes(2);
    expect(addWalletMessage).toHaveBeenCalledTimes(2);
    expect(firstBody.userId).not.toBe(secondBody.userId);
    expect(addWalletMessage).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        address: "0xabc",
        user_id: firstBody.userId,
        not_before: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/),
        not_after: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/),
      }),
    );
    expect(addWalletMessage).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ address: "0xdef", user_id: secondBody.userId }),
    );
  });
});
