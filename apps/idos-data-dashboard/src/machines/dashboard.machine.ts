import type { idOSClient } from "@idos-network/client";
import { WALLET_TYPES, type WalletType } from "@idos-network/kwil-infra/actions";
import type { WalletSelector } from "@near-wallet-selector/core";
import { assign, fromPromise, setup } from "xstate";

export interface DashboardContext {
  walletType: WalletType | null;
  walletAddress: string | null;
  walletPublicKey: string | null;
  idOSClient: idOSClient | null;
  nearSelector: WalletSelector | null;
  error: string | null;
}

export type DashboardEvent =
  | { type: "CONNECT_EVM" }
  | { type: "CONNECT_NEAR" }
  | { type: "CONNECT_STELLAR" }
  | { type: "CONNECT_XRPL" }
  | { type: "CONNECT_FACESIGN" }
  | { type: "DISCONNECT" }
  | { type: "RETRY" }
  | {
      type: "WALLET_CONNECTED";
      walletAddress: string;
      walletPublicKey: string;
      nearSelector: WalletSelector | null;
    }
  | { type: "WALLET_CONNECT_ERROR"; error: string };

export type ConnectWalletInput = {
  walletType: WalletType;
  nearSelector: WalletSelector | null;
};

export type InitializeIdOSInput = {
  walletType: WalletType;
  walletAddress: string;
  walletPublicKey: string;
  nearSelector: WalletSelector | null;
};

export type InitializeIdOSOutput = {
  client: idOSClient;
  hasProfile: boolean;
};

export type DisconnectWalletInput = {
  walletType: WalletType | null;
  nearSelector: WalletSelector | null;
  idOSClient: idOSClient | null;
};

export type ConnectWalletOutput = {
  walletAddress: string;
  walletPublicKey: string;
  nearSelector: WalletSelector | null;
};

export type ReconnectWalletInput = {
  walletType: WalletType;
  walletAddress: string;
  walletPublicKey: string;
};

export type ReconnectWalletOutput = {
  nearSelector: WalletSelector | null;
};

const STORAGE_KEY = "dashboard-wallet";

function getPersistedWallet(): {
  walletType: WalletType;
  walletAddress: string;
  walletPublicKey: string;
} | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw);
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      typeof parsed.walletAddress === "string" &&
      typeof parsed.walletPublicKey === "string" &&
      typeof parsed.walletType === "string" &&
      WALLET_TYPES.includes(parsed.walletType)
    ) {
      return {
        walletType: parsed.walletType as WalletType,
        walletAddress: parsed.walletAddress,
        walletPublicKey: parsed.walletPublicKey,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export function persistWallet(
  walletType: WalletType | null,
  walletAddress: string | null,
  walletPublicKey: string | null,
) {
  if (walletType && walletAddress && walletPublicKey) {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ walletType, walletAddress, walletPublicKey }),
    );
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

// Placeholder actors -- real implementations are injected via `.provide()` in dashboard.actor.ts
const noopConnectWallet = fromPromise<ConnectWalletOutput, ConnectWalletInput>(async () => {
  throw new Error("connectWallet actor not provided");
});

const noopInitializeIdOS = fromPromise<InitializeIdOSOutput, InitializeIdOSInput>(async () => {
  throw new Error("initializeIdOS actor not provided");
});

const noopDisconnectWallet = fromPromise<void, DisconnectWalletInput>(async () => {
  throw new Error("disconnectWallet actor not provided");
});

const noopReconnectWallet = fromPromise<ReconnectWalletOutput, ReconnectWalletInput>(async () => {
  throw new Error("reconnectWallet actor not provided");
});

export const dashboardMachine = setup({
  types: {
    context: {} as DashboardContext,
    events: {} as DashboardEvent,
  },
  actors: {
    connectWallet: noopConnectWallet,
    initializeIdOS: noopInitializeIdOS,
    disconnectWallet: noopDisconnectWallet,
    reconnectWallet: noopReconnectWallet,
  },
  guards: {
    hasPersistedWallet: () => getPersistedWallet() !== null,
  },
  actions: {
    persistWalletToStorage: ({ context }) => {
      persistWallet(context.walletType, context.walletAddress, context.walletPublicKey);
    },
    clearPersistedWallet: () => {
      persistWallet(null, null, null);
    },
    resetWalletState: assign({
      walletType: () => null,
      walletAddress: () => null,
      walletPublicKey: () => null,
      nearSelector: () => null,
      error: () => null,
      idOSClient: () => null,
    }),
  },
}).createMachine({
  id: "dashboard",
  initial: "idle",
  context: {
    walletType: null,
    walletAddress: null,
    walletPublicKey: null,
    idOSClient: null,
    nearSelector: null,
    error: null,
  },
  states: {
    idle: {
      always: [{ target: "reconnecting", guard: "hasPersistedWallet" }, { target: "disconnected" }],
    },

    disconnected: {
      entry: assign({ error: () => null }),
      on: {
        CONNECT_EVM: {
          target: "connecting",
          actions: assign({ walletType: () => "EVM" as const }),
        },
        CONNECT_NEAR: {
          target: "connecting",
          actions: assign({ walletType: () => "NEAR" as const }),
        },
        CONNECT_STELLAR: {
          target: "connecting",
          actions: assign({ walletType: () => "Stellar" as const }),
        },
        CONNECT_XRPL: {
          target: "connecting",
          actions: assign({ walletType: () => "XRPL" as const }),
        },
        CONNECT_FACESIGN: {
          target: "connecting",
          actions: assign({ walletType: () => "FaceSign" as const }),
        },
      },
    },

    connecting: {
      invoke: {
        src: "connectWallet",
        input: ({ context }): ConnectWalletInput => {
          if (!context.walletType) {
            throw new Error("walletType not set");
          }

          return {
            walletType: context.walletType,
            nearSelector: context.nearSelector,
          };
        },
        onDone: {
          target: "initializingIdOS",
          actions: [
            assign({
              walletAddress: ({ event }) => event.output.walletAddress,
              walletPublicKey: ({ event }) => event.output.walletPublicKey,
              nearSelector: ({ event }) => event.output.nearSelector,
            }),
            "persistWalletToStorage",
          ],
        },
        onError: {
          target: "error",
          actions: assign({
            error: ({ event }) => {
              console.error("Failed to connect wallet", event.error);
              return event.error instanceof Error
                ? event.error.message
                : "Failed to connect wallet";
            },
          }),
        },
      },
      on: {
        WALLET_CONNECTED: {
          target: "initializingIdOS",
          actions: [
            assign({
              walletAddress: ({ event }) => event.walletAddress,
              walletPublicKey: ({ event }) => event.walletPublicKey,
              nearSelector: ({ event }) => event.nearSelector,
            }),
            "persistWalletToStorage",
          ],
        },
        WALLET_CONNECT_ERROR: {
          target: "disconnected",
          actions: assign({
            error: ({ event }) => event.error,
          }),
        },
        CONNECT_EVM: {
          target: "connecting",
          actions: assign({ walletType: () => "EVM" as const }),
        },
        CONNECT_NEAR: {
          target: "connecting",
          actions: assign({ walletType: () => "NEAR" as const }),
        },
        CONNECT_STELLAR: {
          target: "connecting",
          actions: assign({ walletType: () => "Stellar" as const }),
        },
        CONNECT_XRPL: {
          target: "connecting",
          actions: assign({ walletType: () => "XRPL" as const }),
        },
        CONNECT_FACESIGN: {
          target: "connecting",
          actions: assign({ walletType: () => "FaceSign" as const }),
        },
      },
    },

    reconnecting: {
      entry: assign(() => {
        const persisted = getPersistedWallet();
        if (!persisted) {
          return {};
        }
        return {
          walletType: persisted.walletType,
          walletAddress: persisted.walletAddress,
          walletPublicKey: persisted.walletPublicKey,
        };
      }),
      invoke: {
        src: "reconnectWallet",
        input: ({ context }): ReconnectWalletInput => {
          if (!context.walletType || !context.walletAddress || !context.walletPublicKey) {
            throw new Error("Missing persisted wallet data");
          }
          return {
            walletType: context.walletType,
            walletAddress: context.walletAddress,
            walletPublicKey: context.walletPublicKey,
          };
        },
        onDone: {
          target: "initializingIdOS",
          actions: assign({
            nearSelector: ({ event }) => event.output.nearSelector,
          }),
        },
        onError: {
          target: "disconnected",
          actions: ["resetWalletState", "clearPersistedWallet"],
        },
      },
    },

    initializingIdOS: {
      invoke: {
        src: "initializeIdOS",
        input: ({ context }): InitializeIdOSInput => {
          if (!context.walletType || !context.walletAddress || !context.walletPublicKey) {
            throw new Error("Missing wallet data for idOS initialization");
          }
          return {
            walletType: context.walletType,
            walletAddress: context.walletAddress,
            walletPublicKey: context.walletPublicKey,
            nearSelector: context.nearSelector,
          };
        },
        onDone: [
          {
            target: "loggedIn",
            guard: ({ event }) => event.output.hasProfile,
            actions: assign({
              idOSClient: ({ event }) => event.output.client,
            }),
          },
          {
            target: "noProfile",
            actions: assign({
              idOSClient: ({ event }) => event.output.client,
            }),
          },
        ],
        onError: {
          target: "error",
          actions: assign({
            error: ({ event }) => {
              console.error("Failed to initialize idOS", event.error);
              return event.error instanceof Error
                ? event.error.message
                : "Failed to initialize idOS";
            },
          }),
        },
      },
    },

    noProfile: {
      on: {
        DISCONNECT: "disconnecting",
      },
    },

    loggedIn: {
      on: {
        DISCONNECT: "disconnecting",
      },
    },

    error: {
      on: {
        RETRY: {
          target: "connecting",
          actions: assign({ error: () => null }),
        },
        DISCONNECT: "disconnecting",
      },
    },

    disconnecting: {
      invoke: {
        src: "disconnectWallet",
        input: ({ context }): DisconnectWalletInput => ({
          walletType: context.walletType,
          nearSelector: context.nearSelector,
          idOSClient: context.idOSClient,
        }),
        onDone: {
          target: "disconnected",
          actions: ["resetWalletState", "clearPersistedWallet"],
        },
        onError: {
          target: "disconnected",
          actions: ["resetWalletState", "clearPersistedWallet"],
        },
      },
    },
  },
});
