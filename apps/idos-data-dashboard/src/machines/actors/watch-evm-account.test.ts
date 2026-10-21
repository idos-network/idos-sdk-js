import { watchAccount } from "@wagmi/core";
import { describe, expect, it, vi } from "vitest";
import { createActor, setup } from "xstate";

import { watchEvmAccount } from "./watch-evm-account";

vi.mock("@wagmi/core", () => ({ watchAccount: vi.fn(() => () => {}) }));
vi.mock("@/core/wagmi", () => ({ wagmiConfig: {} }));

describe("watchEvmAccount", () => {
  it("sends DISCONNECT only when the EVM account switches to another address", () => {
    const onDisconnect = vi.fn();
    const parent = setup({ actors: { watchEvmAccount } }).createMachine({
      invoke: { src: "watchEvmAccount", input: { walletType: "EVM", walletAddress: "0xAbC" } },
      on: { DISCONNECT: { actions: onDisconnect } },
    });
    const actor = createActor(parent).start();

    const { onChange } = vi.mocked(watchAccount).mock.calls[0][1];
    onChange({ address: "0xabc" } as never, {} as never);
    expect(onDisconnect).not.toHaveBeenCalled();

    onChange({ address: "0xdef" } as never, {} as never);
    expect(onDisconnect).toHaveBeenCalledOnce();
    actor.stop();
  });
});
