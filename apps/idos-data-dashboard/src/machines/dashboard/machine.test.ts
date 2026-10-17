import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createActor, fromCallback, fromPromise, waitFor } from "xstate";

import {
  type DashboardEvent,
  type DisconnectInput,
  dashboardMachine,
  type InitializeIdOSInput,
  type InitializeIdOSOutput,
  type ReconnectWalletInput,
  type ReconnectWalletOutput,
  type WatchEvmAccountInput,
} from "./machine";

const walletA = {
  walletType: "EVM",
  walletAddress: "0xAaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  walletPublicKey: "0xAaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
};

describe("dashboard machine session lifecycle", () => {
  const clearServerSession = vi.fn();

  beforeEach(() => {
    clearServerSession.mockReset();
    const store = new Map([["dashboard-wallet", JSON.stringify(walletA)]]);
    vi.stubGlobal("window", {});
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => store.set(key, value),
      removeItem: (key: string) => store.delete(key),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function start(reconnect: () => Promise<ReconnectWalletOutput>, watchSendsDisconnect = false) {
    const actor = createActor(
      dashboardMachine.provide({
        actions: { clearServerSession },
        actors: {
          reconnectWallet: fromPromise<ReconnectWalletOutput, ReconnectWalletInput>(reconnect),
          initializeIdOS: fromPromise<InitializeIdOSOutput, InitializeIdOSInput>(async () => ({
            client: {} as InitializeIdOSOutput["client"],
            hasProfile: true,
          })),
          watchEvmAccount: fromCallback<DashboardEvent, WatchEvmAccountInput>(({ sendBack }) => {
            if (watchSendsDisconnect) sendBack({ type: "DISCONNECT" });
          }),
          disconnect: fromPromise<void, DisconnectInput>(async () => {}),
        },
      }),
    );
    actor.start();
    return actor;
  }

  it("clears the server session when an EVM reconnect finds a different address", async () => {
    const actor = start(async () => {
      throw new Error("EVM reconnection address mismatch");
    });

    await waitFor(actor, (s) => s.matches("disconnected"));
    expect(clearServerSession).toHaveBeenCalled();
    actor.stop();
  });

  it("keeps the server session on a successful reconnect", async () => {
    const actor = start(async () => ({ nearSelector: null }));

    await waitFor(actor, (s) => s.matches("loggedIn"));
    expect(clearServerSession).not.toHaveBeenCalled();
    actor.stop();
  });

  it("disconnects when the account watcher reports a switched account", async () => {
    const actor = start(async () => ({ nearSelector: null }), true);

    await waitFor(actor, (s) => s.matches("disconnected"));
    expect(clearServerSession).toHaveBeenCalled();
    actor.stop();
  });
});
