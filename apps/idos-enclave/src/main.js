import { Enclave } from "./enclave";
import "./styles.css";

const enclaveWindow = window.self;
const hasParentWindow = enclaveWindow !== window.top;

if (hasParentWindow) {
  const parentOrigin = new URL(document.referrer).origin;
  new Enclave({ parentOrigin });
} else {
  window.location = "https://idos.network";
}
