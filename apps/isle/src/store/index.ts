import { createNode } from "@sanity/comlink";
import { create } from "zustand";

import type {
  IsleConnectionStatus,
  IsleControllerMessage,
  IsleNodeMessage,
  IsleStatus,
  IsleTheme,
} from "@idos-network/core";

interface NodeState {
  connectionStatus: IsleConnectionStatus;
  address: string | undefined;
  status: IsleStatus;
  node: ReturnType<typeof createNode<IsleNodeMessage, IsleControllerMessage>> | null;
  theme?: IsleTheme;
  initializeNode: () => () => void;
  connectWallet: () => void;
  linkWallet: () => void;
  createProfile: () => void;
}

type StateUpdate = Partial<Pick<NodeState, "connectionStatus" | "address" | "theme" | "status">>;

const createStateUpdate = (update: StateUpdate): StateUpdate => {
  return Object.fromEntries(
    Object.entries(update).filter(([_, value]) => value !== undefined),
  ) as StateUpdate;
};

const handleNodeUpdate = (
  node: ReturnType<typeof createNode<IsleNodeMessage, IsleControllerMessage>>,
  update: StateUpdate,
  set: (fn: (state: NodeState) => NodeState) => void,
) => {
  const stateUpdate = createStateUpdate(update);

  if (Object.keys(stateUpdate).length === 0) return;

  set((state) => ({
    ...state,
    ...stateUpdate,
  }));

  // Only send defined values in the response
  node.post("updated", {
    theme: update.theme,
    status: update.status,
    connectionStatus: update.connectionStatus,
  });
};

export const useIsleStore = create<NodeState>((set) => ({
  connectionStatus: "initializing",
  address: undefined,
  status: "initializing",
  node: null,
  initializeNode: () => {
    const node = createNode<IsleNodeMessage, IsleControllerMessage>({
      name: "iframe",
      connectTo: "window",
    });

    node.on("initialize", ({ theme }) => {
      const _theme = theme || (localStorage.getItem("theme") as IsleTheme);
      set({ theme: _theme });
      node.post("initialized", { theme: _theme });
    });

    node.on("update", (update) => {
      handleNodeUpdate(node, update, set);
    });

    set({ node });
    return node.start();
  },
  connectWallet: () => {
    useIsleStore.getState().node?.post("connect-wallet", {});
  },
  linkWallet: () => {
    useIsleStore.getState().node?.post("link-wallet", {});
  },
  createProfile: () => {
    useIsleStore.getState().node?.post("create-profile", {});
  },
}));
