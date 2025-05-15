import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "@/app";
import { ThemeProvider } from "@/components/ui";
import Minimized from "./components/minimized";

import "@fontsource-variable/inter/index.css";
const root = document.getElementById("root");

if (!root) {
  throw new Error("Root element not found");
}

createRoot(root).render(
  <StrictMode>
    <ThemeProvider>
      <Minimized>
        <App />
      </Minimized>
    </ThemeProvider>
  </StrictMode>,
);
