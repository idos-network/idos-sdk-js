import { render } from "preact";

import { App } from "@/app";
import { Enclave } from "@/lib/enclave";
import "@/styles.css";

const enclaveWindow = window.self;
const hasParentWindow = enclaveWindow !== window.top;

if (hasParentWindow) {
  const parentOrigin = new URL(document.referrer).origin;
  const enclave = new Enclave({ parentOrigin });

  const root = document.getElementById("app");
  if (root) render(<App enclave={enclave} />, root);
} else {
  window.location.replace("https://idos.network");
}
