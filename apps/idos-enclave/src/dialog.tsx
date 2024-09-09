import { Store } from "@idos-network/idos-store";
import { render } from "preact";
import { App } from "./pages/App";
import "./styles.css";

const enclave = window.opener;

if (enclave.origin !== window.origin) throw new Error("Bad origin");

const root = document.getElementById("app");

if (!root) throw new Error("Root element not found");

const store = new Store();
render(<App store={store} enclave={enclave} />, root);
