import { createNode } from "@sanity/comlink";
import { create } from "zustand";

import type {
  IsleControllerMessage,
  IsleNodeMessage,
  IsleStatus,
  IsleTheme,
} from "@idos-network/core";

interface NodeState {
  status: IsleStatus;
  node: ReturnType<typeof createNode<IsleNodeMessage, IsleControllerMessage>> | null;
  theme?: IsleTheme;
  initializeNode: () => () => void;
  connectWallet: () => void;
  disconnectWallet: () => void;
}

export const useIsleStore = create<NodeState>((set) => ({
  status: "disconnected" as const,
  node: null,
  initializeNode: () => {
    const node = createNode<IsleNodeMessage, IsleControllerMessage>({
      name: "iframe",
      connectTo: "window",
    });

    node.on("initialize", ({ theme }) => {
      const _theme = theme ?? (localStorage.getItem("theme") as IsleTheme) ?? "light";
      set({ theme: _theme });
      node.post("initialized", { theme: _theme });
    });

    node.on("update", ({ theme, status }) => {
      set((state) => ({
        ...state,
        ...(theme !== undefined && { theme }),
        ...(status !== undefined && { status }),
      }));
      node.post("updated", { theme, status });
    });

    set({ node });
    return node.start();
  },
  connectWallet: () => {
    useIsleStore.getState().node?.post("connect-wallet", {});
  },
  disconnectWallet: () => {
    useIsleStore.getState().node?.post("disconnect-wallet", {});
  },
}));
