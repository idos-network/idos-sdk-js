import { Enclave } from "./enclave";

if (window !== window.top) {
  const parentUrl = new URL(document.referrer).origin;
  const humanId = document.location.search.match(/human_id=(.*)/)[1];

  new Enclave({ parentUrl, humanId }).init();
}
