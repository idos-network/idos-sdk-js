// @ts-expect-error Not typed yet
import { Enclave } from "./lib/enclave";
import "./styles.css";

const enclaveWindow = window.self;
const hasParentWindow = enclaveWindow !== window.top;

if (hasParentWindow) {
  const parentOrigin = new URL(document.referrer).origin;
  new Enclave({ parentOrigin });
} else {
  window.location.replace("https://idos.network");
}
