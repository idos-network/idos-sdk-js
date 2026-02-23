import "./styles.css";

import { createRouter, RouterProvider } from "@tanstack/react-router";
import { createRoot } from "react-dom/client";

import { KeyStorageContextProvider, useKeyStorageContext } from "@/providers/key.provider";
import { routeTree } from "./routeTree.gen";

const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  context: {
    // biome-ignore lint/style/noNonNullAssertion: This is passed in React land
    auth: undefined!,
  },
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

function App() {
  const { isKeyAvailable } = useKeyStorageContext();
  return (
    <RouterProvider
      router={router}
      context={{
        auth: { isKeyAvailable },
      }}
    />
  );
}

const domNode = document.getElementById("root");
if (!domNode) throw new Error("No root element found");

const root = createRoot(domNode);
root.render(
  <KeyStorageContextProvider>
    <App />
  </KeyStorageContextProvider>,
);
