import { generateMnemonic } from "web-bip39";
import * as Base64Codec from "@stablelib/base64"
import * as Utf8Codec from "@stablelib/utf8"
import wordlist from "web-bip39/wordlists/english";
import * as DOMPurify from "dompurify";
import "./styles.css";

const sanitize = (html) => (
  DOMPurify.default.sanitize(html, { ALLOWED_TAGS: [] })
);

class Dialog {
  constructor() {
    this.enclave = window.opener;
    if (this.enclave.origin !== window.origin) throw new Error("Bad origin");

    this.initUi();
    this.listenToEnclave();
  }

  initUi() {
    this.beforeUnload = e => {
      e.preventDefault();
      e.returnValue = "";
      this.respondToEnclave({ error: "closed" });
    };
    window.addEventListener("beforeunload", this.beforeUnload);
  }

  async confirmForm({ message, origin }) {
    message = sanitize(message);
    origin = sanitize(origin);

    const confirmForm = document.querySelector("form[name=confirm]");
    confirmForm.style.display = "block";
    confirmForm.querySelector("#origin").innerHTML = origin;
    confirmForm.querySelector("#message").innerHTML = message;

    return new Promise(resolve => (
      confirmForm.addEventListener("submit", e => {
        e.preventDefault();
        resolve(e.submitter.id === "yes");
      })
    ));
  }

  async passwordForm() {
    const passwordForm = document.querySelector("form[name=password]");
    passwordForm.style.display = "block";
    passwordForm.querySelector("input[type=password]").focus();

    return new Promise(resolve => (
      passwordForm.addEventListener("submit", e => {
        e.preventDefault();
        resolve(Object.fromEntries(new FormData(e.target).entries()));
      })
    ));
  }

  async password() {
    const { password, duration } = await this.passwordForm();

    this.respondToEnclave({ result: { password, duration } });
  }

  async passkey() {
    const { password, duration } = await this.passwordForm();

    try {
      const credentialId = await this.maybeCreatePasskeyCredential(password);
      this.respondToEnclave({ result: { password, duration, credentialId } });
    } catch (e) {
      this.respondToEnclave({ error: e.toString() });
    }
  }

  async confirm({ message: { message, origin } }) {
    const confirmed = await this.confirmForm({ message, origin });

    this.respondToEnclave({ result: { confirmed } });
  }

  async maybeCreatePasskeyCredential(password) {
    const displayName = "idOS User";

    const credential = await navigator.credentials.create({
      publicKey: {
        challenge: crypto.getRandomValues(new Uint8Array(10)),
        rp: { name: "idOS.network" },
        user: {
          id: Utf8Codec.encode(password),
          displayName,
          name: displayName,
        },
        pubKeyCredParams: [ {type: "public-key", alg: -7} ],
      },
    });

    return Base64Codec.encode(new Uint8Array(credential.rawId));
  }

  async listenToEnclave() {
    window.addEventListener("message", async (event) => {
      if (event.source !== this.enclave) return;

      const { data: requestData, ports } = event;

      if (!["passkey", "password", "confirm"].includes(requestData.intent))
        throw new Error(`Unexpected request from parent: ${requestData.intent}`);

      this.responsePort = ports[0];

      this[requestData.intent](requestData);
    });
  }

  respondToEnclave (message) {
    this.responsePort.postMessage(message);

    window.removeEventListener("beforeunload", this.beforeUnload);
    this.responsePort.close();
  };
}

new Dialog();
