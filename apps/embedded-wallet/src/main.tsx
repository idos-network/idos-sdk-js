import { render } from "preact";
import { App } from "./app";
import "./index.css";

const rootElement = document.getElementById("app");
if (rootElement && !rootElement.innerHTML) {
  render(<App />, rootElement);
}
