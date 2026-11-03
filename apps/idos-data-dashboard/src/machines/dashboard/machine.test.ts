import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createActor, fromCallback, fromPromise, waitFor } from "xstate";

import {
  type ConnectWalletInput,
  type ConnectWalletOutput,
  type CreateProfileInput,
  type CreateProfileOutput,
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
  let disconnectCalls = 0;

  beforeEach(() => {
    disconnectCalls = 0;
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

  function start(
    reconnect: () => Promise<ReconnectWalletOutput>,
    watchSendsDisconnect = false,
    disconnect: () => Promise<void> = async () => {},
  ) {
    const actor = createActor(
      dashboardMachine.provide({
        actors: {
          reconnectWallet: fromPromise<ReconnectWalletOutput, ReconnectWalletInput>(reconnect),
          initializeIdOS: fromPromise<InitializeIdOSOutput, InitializeIdOSInput>(async () => ({
            client: {} as InitializeIdOSOutput["client"],
            hasProfile: true,
          })),
          watchEvmAccount: fromCallback<DashboardEvent, WatchEvmAccountInput>(({ sendBack }) => {
            if (watchSendsDisconnect) sendBack({ type: "DISCONNECT" });
          }),
          disconnect: fromPromise<void, DisconnectInput>(async () => {
            disconnectCalls += 1;
            await disconnect();
          }),
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
    expect(disconnectCalls).toBe(1);
    actor.stop();
  });

  it("keeps the server session on a successful reconnect", async () => {
    const actor = start(async () => ({ nearSelector: null }));

    await waitFor(actor, (s) => s.matches("loggedIn"));
    expect(disconnectCalls).toBe(0);
    actor.stop();
  });

  it("disconnects when the account changes during idOS initialization", async () => {
    const seen = new Set<string>();
    const actor = createActor(
      dashboardMachine.provide({
        actors: {
          reconnectWallet: fromPromise<ReconnectWalletOutput, ReconnectWalletInput>(async () => ({
            nearSelector: null,
          })),
          initializeIdOS: fromPromise<InitializeIdOSOutput, InitializeIdOSInput>(
            () => new Promise(() => {}),
          ),
          watchEvmAccount: fromCallback<DashboardEvent, WatchEvmAccountInput>(({ sendBack }) => {
            sendBack({ type: "DISCONNECT" });
          }),
          disconnect: fromPromise<void, DisconnectInput>(async () => {
            disconnectCalls += 1;
          }),
        },
      }),
    );
    actor.subscribe((snapshot) => {
      if (typeof snapshot.value === "string") seen.add(snapshot.value);
    });
    actor.start();

    await waitFor(actor, (s) => s.matches("disconnected"));
    expect(seen.has("loggedIn")).toBe(false);
    expect(disconnectCalls).toBe(1);
    actor.stop();
  });

  it("disconnects when the account changes while creating a profile", async () => {
    let watchProfile = false;
    const seen = new Set<string>();
    const actor = createActor(
      dashboardMachine.provide({
        actors: {
          reconnectWallet: fromPromise<ReconnectWalletOutput, ReconnectWalletInput>(async () => ({
            nearSelector: null,
          })),
          initializeIdOS: fromPromise<InitializeIdOSOutput, InitializeIdOSInput>(async () => ({
            client: { state: "with-user-signer" } as InitializeIdOSOutput["client"],
            hasProfile: false,
          })),
          createProfile: fromPromise<CreateProfileOutput, CreateProfileInput>(
            () => new Promise(() => {}),
          ),
          watchEvmAccount: fromCallback<DashboardEvent, WatchEvmAccountInput>(({ sendBack }) => {
            if (watchProfile) sendBack({ type: "DISCONNECT" });
          }),
          disconnect: fromPromise<void, DisconnectInput>(async () => {
            disconnectCalls += 1;
          }),
        },
      }),
    );
    actor.subscribe((snapshot) => {
      if (typeof snapshot.value === "string") seen.add(snapshot.value);
    });
    actor.start();

    await waitFor(actor, (s) => s.matches("noProfile"));
    watchProfile = true;
    actor.send({ type: "CREATE_PROFILE" });
    await waitFor(actor, (s) => s.matches("disconnected"));
    expect(seen.has("loggedIn")).toBe(false);
    expect(disconnectCalls).toBe(1);
    actor.stop();
  });

  it("disconnects when the account watcher reports a switched account", async () => {
    const actor = start(async () => ({ nearSelector: null }), true);

    await waitFor(actor, (s) => s.matches("disconnected"));
    expect(disconnectCalls).toBe(1);
    actor.stop();
  });

  it("retries session deletion instead of connecting when the delete failed", async () => {
    let attempts = 0;
    const actor = start(
      async () => ({ nearSelector: null }),
      false,
      async () => {
        attempts += 1;
        if (attempts === 1) throw new Error("Failed to delete session");
      },
    );

    await waitFor(actor, (s) => s.matches("loggedIn"));
    actor.send({ type: "DISCONNECT" });
    await waitFor(actor, (s) => s.matches("error"));
    actor.send({ type: "RETRY" });
    await waitFor(actor, (s) => s.matches("disconnected"));
    expect(attempts).toBe(2);
    actor.stop();
  });

  it("retries the FaceSign wipe instead of connecting when it failed", async () => {
    let attempts = 0;
    const actor = start(
      async () => ({ nearSelector: null }),
      false,
      async () => {
        attempts += 1;
        if (attempts === 1) throw new Error("Failed to clear FaceSign keys");
      },
    );

    await waitFor(actor, (s) => s.matches("loggedIn"));
    actor.send({ type: "DISCONNECT" });
    await waitFor(actor, (s) => s.matches("error"));
    actor.send({ type: "RETRY" });
    await waitFor(actor, (s) => s.matches("disconnected"));
    expect(attempts).toBe(2);
    actor.stop();
  });

  it("reconnects on retry when the failure was not session deletion", async () => {
    let connectAttempts = 0;
    const actor = createActor(
      dashboardMachine.provide({
        actors: {
          reconnectWallet: fromPromise<ReconnectWalletOutput, ReconnectWalletInput>(async () => ({
            nearSelector: null,
          })),
          connectWallet: fromPromise<ConnectWalletOutput, ConnectWalletInput>(async () => {
            connectAttempts += 1;
            return {
              walletAddress: walletA.walletAddress,
              walletPublicKey: walletA.walletPublicKey,
              nearSelector: null,
            };
          }),
          initializeIdOS: fromPromise<InitializeIdOSOutput, InitializeIdOSInput>(async () => {
            throw new Error("Failed to initialize idOS");
          }),
          watchEvmAccount: fromCallback<DashboardEvent, WatchEvmAccountInput>(() => {}),
          disconnect: fromPromise<void, DisconnectInput>(async () => {}),
        },
      }),
    );
    actor.start();
    await waitFor(actor, (s) => s.matches("error"));
    actor.send({ type: "RETRY" });
    await waitFor(actor, () => connectAttempts === 1);
    expect(actor.getSnapshot().matches("disconnecting")).toBe(false);
    actor.stop();
  });
});
