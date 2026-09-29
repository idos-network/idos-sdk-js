import { createRoot } from "react-dom/client";

import "./connector-persistence";
import { App } from "./app";
import "./index.css";
import { WalletProvider } from "./state";

const rootElement = document.getElementById("app");

if (rootElement) {
  const root = createRoot(rootElement);
  root.render(
    <WalletProvider>
      <App />
    </WalletProvider>,
  );
}
