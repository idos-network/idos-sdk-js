import { Enclave } from "./lib/enclave";
import "./styles.css";

const enclaveWindow = window.self;
const hasParentWindow = enclaveWindow !== window.top;

if (hasParentWindow) {
  const parentOrigin = new URL(document.referrer).origin;
  try {
    new Enclave({ parentOrigin });
  } catch (error) {
    // E.g. an unknown host (see lib/config.ts). Fail the parent's requests instead of leaving
    // them unanswered, so IframeEnclave.load() rejects.
    console.error("idOS enclave failed to start:", error);
    window.addEventListener("message", (event) => {
      if (event.origin !== parentOrigin || event.ports.length === 0) return;
      event.ports[0].postMessage({ error });
      event.ports[0].close();
    });
  }
} else {
  window.location.replace("https://idos.network");
}
