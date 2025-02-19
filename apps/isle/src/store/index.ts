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
  connectionStatus: IsleConnectionStatus | "initialising";
  status: IsleStatus | "initialising";
  node: ReturnType<typeof createNode<IsleNodeMessage, IsleControllerMessage>> | null;
  theme?: IsleTheme;
  initializeNode: () => () => void;
  connectWallet: () => void;
}

export const useIsleStore = create<NodeState>((set) => ({
  connectionStatus: "initialising",
  status: "initialising",
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

    node.on("update", ({ connectionStatus, theme, status }) => {
      set((state) => ({
        ...state,
        ...(connectionStatus !== undefined && { connectionStatus }),
        ...(status !== undefined && { status }),
        ...(theme !== undefined && { theme }),
      }));
      node.post("updated", { theme, status, connectionStatus });
    });

    set({ node });
    return node.start();
  },
  connectWallet: () => {
    useIsleStore.getState().node?.post("connect-wallet", {});
  },
}));
