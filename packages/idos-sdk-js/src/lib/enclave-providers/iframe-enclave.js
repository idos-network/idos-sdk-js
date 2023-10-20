import { EnclaveProvider } from "./enclave-provider";

export class IframeEnclave extends EnclaveProvider {
  hostUrl = new URL("https://enclave.idos.network");

  constructor(options) {
    super(options);

    this.container = options.container;
    this.iframe = document.createElement("iframe");
  }

  async load() {
    await this.#loadEnclave();

    return await this.#requestToEnclave({ storage: {} });
  }

  async init(humanId, signerPublicKey) {
    await this.#requestToEnclave({ storage: { humanId, signerPublicKey } });

    if (!(await this.#requestToEnclave({ isReady: {} }))) {
      this.#showEnclave();
    }

    const publicKeys = await this.#requestToEnclave({ keys: {} });
    this.#hideEnclave();

    return publicKeys;
  }

  reset() {
    return this.#requestToEnclave({ reset: {} });
  }

  sign(message) {
    return this.#requestToEnclave({ sign: { message } });
  }

  verifySig(message, signature, signerPublicKey) {
    return this.#requestToEnclave({
      verifySig: { message, signature, signerPublicKey },
    });
  }

  encrypt(message, receiverPublicKey) {
    return this.#requestToEnclave({ encrypt: { message, receiverPublicKey } });
  }

  decrypt(message, senderPublicKey) {
    return this.#requestToEnclave({ decrypt: { message, senderPublicKey } });
  }

  async #loadEnclave() {
    this.iframe.allow = "storage-access";
    this.iframe.referrerPolicy = "origin";
    this.iframe.sandbox = ["forms", "modals", "popups", "same-origin", "scripts"]
      .map((permission) => `allow-${permission}`)
      .join(" ");
    this.iframe.src = this.hostUrl;
    this.iframe.style = Object.entries({
      "background-color": "transparent",
      border: "none",
      display: "none",
      height: "100%",
      width: "100%",
    })
      .map((pair) => pair.join(": "))
      .join("; ");

    this.iframe.addEventListener("load", () => this.iframeLoaded());

    document.querySelector(this.container).style.display = "none";
    document.querySelector(this.container).appendChild(this.iframe);

    return new Promise((resolve) => (this.iframeLoaded = resolve));
  }

  #showEnclave() {
    document.querySelector(this.container).style.display = "block";
    this.iframe.style.display = "block";
  }

  #hideEnclave() {
    this.iframe.parentElement.style.display = "none";
    this.iframe.style.display = "none";
  }

  async #requestToEnclave(request) {
    return await new Promise((resolve, reject) => {
      const { port1, port2 } = new MessageChannel();

      port1.onmessage = ({ data }) => {
        port1.close();

        data.error ? reject(data.error) : resolve(data.result);
      };

      this.iframe.contentWindow.postMessage(request, this.hostUrl.origin, [port2]);
    });
  }
}
