// TODO
// export class MetaMaskSnap {}

export class IframeEnclave {
  constructor(options) {
    this.hostUrl = options?.hostUrl || new URL("https://enclave.idos.network");
    this.container = options.container;
    this.iframe = document.createElement("iframe");
  }

  init (humanId) {
    this.humanId = humanId;

    this.#listenToEnclave();
    this.#openEnclave();

    return this.#responsePromise("publicKeys");
  }

  sign(message) {
    this.#request({ sign: { message } });

    return this.#responsePromise("signed");
  }

  verifySig(message, signature, signerPublicKey) {
    this.#request({ verifySig: { message, signature, signerPublicKey } });

    return this.#responsePromise("verifiedSig");
  }

  encrypt(message, receiverPublicKey) {
    this.#request({ encrypt: { message, receiverPublicKey } });

    return this.#responsePromise("encrypted");
  }

  decrypt(message) {
    this.#request({ decrypt: { message } });

    return this.#responsePromise("decrypted");
  }

  #listenToEnclave() {
    window.addEventListener("message", (event) => {
      const isFromIframe = event.origin === this.hostUrl.origin;
      if (!isFromIframe) { return; }

      const [responseName, responseData] = Object.entries(event.data).flat();

      switch(responseName) {
        case "showEnclave":
          this.#showEnclave();
          break;
        case "publicKeys":
          this.#hideEnclave();
        case "signed":
        case "verifiedSig":
        case "encrypted":
        case "decrypted":
          this[responseName](responseData);
          break;
        default:
          throw new Error(`Unexpected response from enclave: ${responseName}`);
      }
    });
  }

  #request(message) {
    this.iframe.contentWindow.postMessage(message, this.hostUrl.origin);
  }

  #responsePromise(resolver) {
    return new Promise(resolve => this[resolver] = resolve);
  }

  #openEnclave() {
    this.iframe.allow = "storage-access";
    this.iframe.referrerPolicy = "origin";
    this.iframe.sandbox = [
      "forms",
      "modals",
      "popups",
      "same-origin",
      "scripts",
    ].map(permission => `allow-${permission}`).join(" ");
    this.iframe.src = `${this.hostUrl}?human_id=${this.humanId}`;
    this.iframe.style = Object.entries({
      "background-color": "transparent",
      "border": "none",
      "display": "none",
      "height": "30px",
      "width": "150px",
    }).map(pair => pair.join(": ")).join("; ");

    document.querySelector(this.container).appendChild(this.iframe);
  }

  #showEnclave() {
    this.iframe.style.display = "block";
  }

  #hideEnclave() {
    this.iframe.parentElement.style.display = "none";
    this.iframe.style.display = "none";
  }
}
