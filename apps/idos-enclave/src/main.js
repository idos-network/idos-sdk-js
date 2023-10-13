import { Enclave } from "./enclave";
import "./styles.css";

if (window !== window.top) {
  const parentUrl = new URL(document.referrer).origin;

  new Enclave({ parentUrl });
} else {
  window.location = "https://idos.network";
}
