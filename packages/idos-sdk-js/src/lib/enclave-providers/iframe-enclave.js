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

    if (encryptionPublicKey) return encryptionPublicKey;

    this.#showEnclave();
    return this.#requestToEnclave({ keys: { usePasskeys: false } })
      .then(encryptionPublicKey => {
        this.#hideEnclave();
        return encryptionPublicKey;
      });
  }

  reset() {
    return this.#requestToEnclave({ reset: {} });
  }

  async confirm(message) {
    this.#showEnclave();
    return this.#requestToEnclave({ confirm: { message } })
      .then(response => {
        this.#hideEnclave();
        return response;
      });
  }

  encrypt(message, receiverPublicKey) {
    return this.#requestToEnclave({ encrypt: { message, receiverPublicKey } });
  }

  decrypt(message, senderPublicKey) {
    return this.#requestToEnclave({ decrypt: { fullMessage: message, senderPublicKey } });
  }

  async #loadEnclave() {
    // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Permissions-Policy#directives
    const permissionsPolicies = [
      "publickey-credentials-get",
      "storage-access",
    ];

    // https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe#sandbox
    const liftedSandboxRestrictions = [
      "forms",
      "modals",
      "popups",
      "popups-to-escape-sandbox",
      "same-origin",
      "scripts",
    ].map(toLift => `allow-${toLift}`);

    // https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe#referrerpolicy
    const referrerPolicy = "origin";

    const styles = [
      "aspect-ratio: 4/1",
      "background-color: transparent",
      "border: none",
      "display: block",
      "width: 100%",
    ];


    this.iframe.allow = permissionsPolicies.join("; ");
    this.iframe.referrerpolicy = referrerPolicy;
    this.iframe.sandbox = liftedSandboxRestrictions.join(" ");
    this.iframe.src = this.hostUrl;
    this.iframe.style = styles.join("; ");

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
      console.dir(request)
      port1.onmessage = ({ data }) => {
        port1.close();
        console.dir(data)
        data.error ? reject(data.error) : resolve(data.result);
      };
      this.iframe.contentWindow.postMessage(request, this.hostUrl.origin, [port2]);
    });
  }
}
