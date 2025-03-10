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
  accessGrants: Map<
    { consumerPublicKey: string; meta: { name: string; logo: string; url: string } },
    {
      id: string;
      dataId: string;
      type: string;
      originalCredentialId: string;
      lockedUntil: number;
    }[]
  > | null;
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
  accessGrants: null,
  node: null,
  initializeNode: () => {
    const node = createNode<IsleNodeMessage, IsleControllerMessage>({
      name: "iframe",
      connectTo: "window",
    });

    node.on("initialize", ({ theme: newTheme = "dark" }) => {
      set({ theme: newTheme });
      node.post("initialized", { theme: newTheme });
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
