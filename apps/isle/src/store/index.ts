import { createNode } from "@sanity/comlink";
import { create } from "zustand";

import type { ControllerMessage, NodeMessage, idOSIsleStatus, idOSIsleTheme } from "@/types";

interface NodeState {
  status: idOSIsleStatus;
  node: ReturnType<typeof createNode<NodeMessage, ControllerMessage>> | null;
  theme?: idOSIsleTheme;
  initializeNode: () => () => void;
  connectWallet: () => void;
}

export const useIsleStore = create<NodeState>((set) => ({
  status: "disconnected" as const,
  node: null,
  initializeNode: () => {
    const node = createNode<NodeMessage, ControllerMessage>({
      name: "iframe",
      connectTo: "window",
    });

    node.on("initialize", ({ status, theme }) => {
      const _theme = theme ?? (localStorage.getItem("theme") as idOSIsleTheme) ?? "light";
      console.log("initialize", { status, theme: _theme });
      set({ status, theme: _theme });
      node.post("initialized", { status, theme: _theme });
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
}));
