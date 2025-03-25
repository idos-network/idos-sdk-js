import { Store } from "@idos-network/core";
import { render } from "preact";
import { App } from "./pages/App";
import "./styles.css";

const enclave = window.opener;
if (enclave.origin !== window.origin) throw new Error("Bad origin");

const store = new Store(window.localStorage);

const root = document.getElementById("app");

if (!root) throw new Error("Root element not found.");

render(<App store={store} enclave={enclave} />, root);
