import { render } from "preact";

import { App } from "@/app.tsx";
import "@/index.css";

const root = document.getElementById("app");

if (!root) {
  throw new Error("Root element not found");
}

render(<App />, root);
