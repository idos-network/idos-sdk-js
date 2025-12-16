import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./app";
import "./index.css";

const root = document.getElementById("root");

if (root && !root.innerHTML) {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
