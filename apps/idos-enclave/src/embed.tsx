import { render } from "preact";
import { Enclave } from "./lib/enclave.tsx";
import "./styles.css";

const enclaveWindow = window.self;
const hasParentWindow = enclaveWindow !== window.top;
const root = document.getElementById("root");

if (!root) throw new Error("Root element not found.");
if (!hasParentWindow) window.location.replace("https://idos.network");

const parentOrigin = new URL(document.referrer).origin;
render(<Enclave parentOrigin={parentOrigin} />, root);
