import { render } from "preact";
import { App } from "@/app";
import { Enclave } from "./lib/enclave";
import "./styles.css";

const enclaveWindow = window.self;
const hasParentWindow = enclaveWindow !== window.top;

// If the enclave is accessed directly (not inside an iframe), redirect to the main idOS site.
if (!hasParentWindow) {
  window.location.replace("https://idos.network");
} else {
  const documentReferrer = document.referrer;
  if (!documentReferrer) throw new Error("Document referrer not found.");
  const parentOrigin = new URL(document.referrer).origin;

  // Initialize the enclave
  const enclave = new Enclave({ parentOrigin });

  // Render the App component
  const root = document.getElementById("app");
  if (!root) throw new Error("Root element not found.");

  render(<App enclave={enclave} />, root);
}
