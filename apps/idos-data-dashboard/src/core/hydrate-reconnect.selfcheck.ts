import { createConfig, hydrate } from "@wagmi/core";
// cspell:ignore selfcheck
/**
 * reconnectOnMount: false must clear a restored account once, including status.
 * The add-wallet popup uses that flag. AppKit's watchAccount reads connector.id while
 * status is still "connected". Hydrate calls onMount again on the next render, and
 * that second call must leave the wallet the user just connected.
 *
 *   node --experimental-strip-types apps/idos-data-dashboard/src/core/hydrate-reconnect.selfcheck.ts
 */
import assert from "node:assert/strict";
import { http } from "viem";
import { mainnet } from "viem/chains";

const config = createConfig({
  chains: [mainnet],
  transports: { [mainnet.id]: http() },
});

function connectedState() {
  return {
    chainId: mainnet.id,
    connections: new Map([
      [
        "uid",
        {
          accounts: ["0x0b3027f79a5163B95eb9EB171AA90b588E6d58AD"],
          chainId: mainnet.id,
          connector: { id: "injected", name: "Injected", type: "injected", uid: "uid" },
        },
      ],
    ]),
    current: "uid",
    status: "connected" as const,
  };
}

config.setState(connectedState());

const { onMount } = hydrate(config, { reconnectOnMount: false });
await onMount();

assert.equal(config.state.status, "disconnected");
assert.equal(config.state.current, null);
assert.equal(config.state.connections.size, 0);

config.setState(connectedState());
const { onMount: onMountAgain } = hydrate(config, { reconnectOnMount: false });
await onMountAgain();

assert.equal(config.state.status, "connected");
assert.equal(config.state.current, "uid");
assert.equal(config.state.connections.size, 1);
