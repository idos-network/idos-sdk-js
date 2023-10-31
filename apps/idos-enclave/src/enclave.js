import { Store } from "@idos-network/idos-store";
import * as StableBase64 from "@stablelib/base64";
import * as StableUtf8 from "@stablelib/utf8";
import { idOSKeyDerivation } from "./idOSKeyDerivation";
import nacl from "tweetnacl";

export class Enclave {
  constructor({ parentOrigin }) {
    this.parentOrigin = parentOrigin;
    this.passwordButton = document.querySelector("button#password");
    this.consentButton = document.querySelector("button#consent");
    this.store = new Store({
      initWith: ["human-id", "password", "encryption-public-key", "encryption-private-key", "signer-public-key", "signer-address"]
    });
    this.#listenToRequests();
  }

  async reset(keep) {
    this.store.reset(keep);
  }

  async isReady() {
    return !!this.store.get("password");
  }

  async storage(humanId, signerAddress, signerPublicKey) {
    humanId && this.store.set("human-id", humanId);
    signerAddress && this.store.set("signer-address", signerAddress);
    signerPublicKey && this.store.set("signer-public-key", signerPublicKey);

    return {
      humanId: this.store.get("human-id"),
      encryptionPublicKey: this.store.get("encryption-public-key"),
      signerAddress: this.store.get("signer-address"),
      signerPublicKey: this.store.get("signer-public-key"),
    };
  }

  async keys() {
    await this.ensurePassword();
    await this.ensureKeyPair();

    return {
      base64: StableBase64.encode(this.keyPair.publicKey),
      raw: this.keyPair.publicKey,
    };
  }

  // @todo: add `passwordData.duration`
  // @fixme
  // using both storage mediums because different browsers
  // handle sandboxed cross-origin iframes differently
  // wrt localstorage and cookies
  async ensurePassword() {
    if (!this.store.get("password")) {
      this.passwordButton.style.display = "block";
      this.passwordButton.addEventListener("click", async (e) => {
        this.passwordButton.disabled = true;
        this.store.set("password", (await this.#openDialog("password")).string);
        this.ensurePasswordResolver();
      });

      return await new Promise((resolve) => this.ensurePasswordResolver = resolve);
    }

    return Promise.resolve;
  }

  async ensureKeyPair() {
    let secretKey = this.store.get("encryption-private-key");
    secretKey = secretKey && StableBase64.decode(secretKey);

    if (!secretKey) {
      const salt = this.store.get("human-id");
      const password = this.store.get("password");

      secretKey = await idOSKeyDerivation(password, salt);

      this.store.set("encryption-private-key", StableBase64.encode(secretKey));
    }

    this.keyPair = nacl.box.keyPair.fromSecretKey(secretKey);
    this.store.set("encryption-public-key", StableBase64.encode(this.keyPair.publicKey));
  }

  encrypt(plaintext, receiverPublicKey) {
    receiverPublicKey = receiverPublicKey || this.keyPair.publicKey;
    const nonce = nacl.randomBytes(nacl.box.nonceLength);

    if (typeof plaintext === "string") {
      plaintext = StableUtf8.encode(plaintext);
    }

    const encrypted = nacl.box(
      plaintext,
      nonce,
      receiverPublicKey,
      this.keyPair.secretKey
    );
    const fullMessage = new Uint8Array(nonce.length + encrypted.length);
    fullMessage.set(nonce);
    fullMessage.set(encrypted, nonce.length);

    return StableBase64.encode(fullMessage);
  }

  decrypt(ciphertextBase64, senderPublicKey) {
    const binarySenderPublicKey = StableBase64.decode(senderPublicKey);
    let ciphertext;

    try {
      ciphertext = StableBase64.decode(ciphertextBase64);
    } catch (error) {
      ciphertext = StableUtf8.encode(ciphertextBase64);
    }

    const nonce = ciphertext.slice(0, nacl.box.nonceLength);
    const message = ciphertext.slice(nacl.box.nonceLength, ciphertext.length);
    const decryptedMessage = nacl.box.open(
      message,
      nonce,
      binarySenderPublicKey,
      this.keyPair.secretKey
    );

    try {
      return StableUtf8.decode(decryptedMessage);
    } catch (e) {
      return "(decryption failed)";
    }
  }

  async confirm(message) {
    this.consentButton.style.display = "block";
    this.consentButton.addEventListener("click", async (e) => {
      this.consentButton.disabled = true;
      this.ensureConsentResolver();
    });

    await new Promise((resolve) => this.ensureConsentResolver = resolve);

    const { consent } = await this.#openDialog(
      "consent",
      `
      <strong>Consent request</strong>
      <p><small>from ${this.parentOrigin}</small></p>
      <hr>
      <p><code>${message}</code></p>
    `
    );

    return consent;
  }

  messageParent(message) {
    window.parent.postMessage(message, this.parentOrigin);
  }

  #listenToRequests() {
    window.addEventListener("message", async (event) => {
      const isFromParent = event.origin === this.parentOrigin;

      if (!isFromParent) {
        return;
      }

      try {
        const [requestName, requestData] = Object.entries(event.data).flat();
        const {
          humanId,
          message,
          signerPublicKey,
          signerAddress,
          senderPublicKey,
          receiverPublicKey,
          keep,
        } = requestData;

        const paramBuilder = {
          reset: () => [keep],
          storage: () => [humanId, signerAddress, signerPublicKey],
          isReady: () => [],
          keys: () => [],
          encrypt: () => [message, receiverPublicKey],
          decrypt: () => [message, senderPublicKey],
          confirm: () => [message],
        }[requestName];

        if (!paramBuilder) {
          throw new Error(`Unexpected request from parent: ${requestName}`);
        }

        const response = await this[requestName](...paramBuilder());
        event.ports[0].postMessage({ result: response });
      } catch (e) {
        console.log("catch", e);
        event.ports[0].postMessage({ error: e });
      } finally {
        this.passwordButton.style.display = "none";
        this.consentButton.style.display = "none";
        event.ports[0].close();
      }
    });
  }

  async #openDialog(intent, message) {
    const width = 250;
    const left = window.screen.width - width;

    const popupConfig = Object.entries({
      popup: 1,
      top: 0,
      left: left,
      width: width,
      height: 350
    })
      .map((feat) => feat.join("="))
      .join(",");

    const dialogURL = new URL("/dialog.html", window.location.origin);
    dialogURL.search = new URLSearchParams({ intent, message });

    this.dialog = window.open(dialogURL, "idos-dialog", popupConfig);
    this.dialog.addEventListener("load", () => this.windowLoaded());
    await new Promise((resolve) => (this.windowLoaded = resolve));

    return await new Promise((resolve, reject) => {
      const { port1, port2 } = new MessageChannel();
      port1.onmessage = ({ data }) => {
        port1.close();
        this.dialog.close();
        data.error ? reject(data.error) : resolve(data.result);
      };
      this.dialog.postMessage(intent, this.dialog.origin, [port2]);
    });
  }
}
