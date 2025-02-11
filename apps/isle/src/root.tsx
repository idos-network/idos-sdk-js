import { createNode } from "@sanity/comlink";
import { useTheme } from "next-themes";
import { type PropsWithChildren, useEffect } from "react";

type ControllerMessage = {
  type: "initialize";
  data: {
    theme?: "light" | "dark";
  };
};

type NodeMessage = {
  type: "pong";
  data: {
    message: string;
    [key: string]: unknown;
  };
};

export function Root({ children }: PropsWithChildren) {
  const { setTheme } = useTheme();

  useEffect(() => {
    const node = createNode<NodeMessage, ControllerMessage>({
      name: "iframe",
      connectTo: "window",
    });

    node.on("initialize", ({ theme }) => {
      if (theme) {
        setTheme(theme);
      }
    });

    return node.start();
  }, [setTheme]);

  return <>{children}</>;
}
