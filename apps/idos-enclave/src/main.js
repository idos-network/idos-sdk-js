import { Enclave } from "./enclave";

if (window !== window.top) {
  const parentUrl = new URL(document.referrer).origin;

  new Enclave({ parentUrl }).init();
} else {
  window.location = "https://idos.network";
}
