import { EnclaveProvider } from "./enclave-provider";

export class IframeEnclave extends EnclaveProvider {
  hostUrl = new URL(import.meta.env.VITE_IDOS_ENCLAVE_URL);

  constructor(options) {
    super(options);
    this.container = options.container;
    this.iframe = document.createElement("iframe");
  }

  async load() {
    await this.#loadEnclave();
    return await this.#requestToEnclave({ storage: {} });
  }

  async init(humanId, signerAddress, signerPublicKey) {
    let { encryptionPublicKey } = await this.#requestToEnclave({
      storage: { humanId, signerAddress, signerPublicKey },
    });

    if (!encryptionPublicKey) {
      this.#showEnclave();
      encryptionPublicKey = await this.#requestToEnclave({ keys: { usePasskeys: true} });
      this.#hideEnclave();
    }

    return encryptionPublicKey;
  }

  reset() {
    return this.#requestToEnclave({ reset: {} });
  }

  async confirm(message) {
    let response = this.#requestToEnclave({ confirm: { message } });
    this.#showEnclave();

    await response;

    this.#hideEnclave();

    return response;
  }

  encrypt(message, receiverPublicKey) {
    return this.#requestToEnclave({ encrypt: { message, receiverPublicKey } });
  }

  decrypt(message, senderPublicKey) {
    return this.#requestToEnclave({ decrypt: { fullMessage: message, senderPublicKey } });
  }

  async #loadEnclave() {
    this.iframe.allow = "storage-access; publickey-credentials-get *";
    this.iframe.referrerPolicy = "origin";
    this.iframe.sandbox = ["forms", "modals", "popups", "same-origin", "scripts", "popups-to-escape-sandbox"]
      .map((permission) => `allow-${permission}`)
      .join(" ");

    this.iframe.src = this.hostUrl;
    this.iframe.style = Object.entries({
      "background-color": "transparent",
      border: "none",
      display: "block",
      height: "100%",
      width: "100%",
    })
      .map((pair) => pair.join(": "))
      .join("; ");

    document.querySelector(this.container).appendChild(this.iframe);
    return new Promise((resolve) => this.iframe.addEventListener("load", resolve));
  }

  #showEnclave() {
    this.iframe.parentElement.classList.add("visible");
  }

  #hideEnclave() {
    this.iframe.parentElement.classList.remove("visible");
  }

  async #requestToEnclave(request) {
    return new Promise((resolve, reject) => {
      const { port1, port2 } = new MessageChannel();
      port1.onmessage = ({ data }) => {
        port1.close();
        data.error ? reject(data.error) : resolve(data.result);
      };
      this.iframe.contentWindow.postMessage(request, this.hostUrl.origin, [port2]);
    });
  }
}
