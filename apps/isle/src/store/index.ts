import { createNode } from "@sanity/comlink";
import { create } from "zustand";

import type { ControllerMessage, NodeMessage, idOSIsleStatus, idOSIsleTheme } from "@/types";

interface NodeState {
  status: idOSIsleStatus;
  node: ReturnType<typeof createNode<NodeMessage, ControllerMessage>> | null;
  initializeNode: () => () => void;
  theme?: idOSIsleTheme;
}

export const useIsleStore = create<NodeState>((set) => ({
  status: "disconnected",
  node: null,
  initializeNode: () => {
    const node = createNode<NodeMessage, ControllerMessage>({
      name: "iframe",
      connectTo: "window",
    });

    node.on("initialize", ({ theme }) => {
      const _theme = theme ?? (localStorage.getItem("theme") as idOSIsleTheme) ?? "light";
      set({ theme: _theme });
      node.post("initialized", { theme: _theme, status: "disconnected" });
    });

    node.on("theme.update", ({ theme }) => {
      set({ theme });
    });

    node.on("status.update", ({ status }) => {
      set({ status });
    });

    return node.start();
  },
}));
