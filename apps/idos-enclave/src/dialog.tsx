import { render } from "preact";

import { App } from "@/app";
import "@/styles.css";

const enclave = window.opener;
if (enclave.origin !== window.origin) throw new Error("Bad idOS enclave origin");

const root = document.getElementById("app");

if (!root) throw new Error("Root element not found.");

render(<App enclave={enclave} />, root);
