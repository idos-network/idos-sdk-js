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

    // @todo: this should be refactored and simplified.
    node.on("update", ({ connectionStatus, address, theme, status }) => {
      set((state) => ({
        ...state,
        ...(connectionStatus !== undefined && { connectionStatus }),
        ...(address !== undefined && { address }),
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
  linkWallet: () => {
    useIsleStore.getState().node?.post("link-wallet", {});
  },
  createProfile: () => {
    useIsleStore.getState().node?.post("create-profile", {});
  },
}));
