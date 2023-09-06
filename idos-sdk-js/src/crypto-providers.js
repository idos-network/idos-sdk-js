export class IframeEnclave {
  constructor(options) {
    this.hostUrl = options?.hostUrl || new URL("https://enclave.idos.network");
    this.origin = this.hostUrl.origin;
    this.iframe = document.createElement("iframe");
  }

  init (humanId) {
    window.addEventListener("message", (event) => {
      if (event.origin != this.origin) { return; }

      const response = Object.keys(event.data)[0];
      const responseData = Object.values(event.data)[0];

      switch(response) {
        case "publicKey":
        case "encrypted":
        case "decrypted":
          this[response](responseData);
          break;
        default:
          console.log("Unexpected response: ", event.data);
      }
    });

    this.iframe.allow = "storage-access";
    this.iframe.referrerPolicy = "origin";
    this.iframe.sandbox = [
      "forms",
      "modals",
      "popups",
      "same-origin",
      "scripts",
    ].map(permission => `allow-${permission}`).join(" ");
    this.iframe.src = `${this.hostUrl}?human_id=${humanId}`;
    this.iframe.style.display = "none";

    document.body.appendChild(this.iframe);

    return this.#responsePromise("publicKey");
  }

  encrypt(message, receiverPublicKey) {
    this.#request({ encrypt: { message, receiverPublicKey } });

    return this.#responsePromise("encrypted");
  }

  decrypt(message) {
    this.#request({ decrypt: { message } });

    return this.#responsePromise("decrypted");
  }

  #request(message) {
    this.iframe.contentWindow.postMessage(message, this.origin);
  }

  #responsePromise(resolver) {
    return new Promise(resolve => this[resolver] = resolve);
  }
}
