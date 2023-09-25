import scrypt from "scrypt-js";
import nacl from "tweetnacl";
import * as StableBase64 from "@stablelib/base64";
import * as StableUtf8 from "@stablelib/utf8";

const storageKey = "idos-password";
const encoder = new TextEncoder();

export class Enclave {
  constructor(options) {
    this.parentUrl = options.parentUrl;
    this.humanId = options.humanId;
  }

  async init() {
    this.password = this.password || window.localStorage.getItem(storageKey) || document.cookie.match(`.*${storageKey}=(.*);`)?.at(0);
    this.#listenToRequests();
  }

  async isReady() {
    return !!this.password;
  }

  async keys() {
    await this.ensurePassword();
    await this.deriveKeyPair();
    await this.deriveKeyPairSig();

    return {
      encryption: {
        base64: StableBase64.encode(this.keyPair.publicKey),
        raw: this.keyPair.publicKey,
      },
      sig: {
        base64: StableBase64.encode(this.keyPairSig.publicKey),
        raw: this.keyPairSig.publicKey,
      },
    };
  }

  // TODO
  // passwordData.duration
  // FIXME
  // using both storage mediums because different browsers
  // handle sandboxed cross-origin iframes differently
  // wrt localstorage and cookies
  async ensurePassword() {
    if (!this.password) {
      document.querySelector("#start").addEventListener("click", async (e) => {
        this.password = (await this.#openDialog("password")).string;

        window.localStorage.setItem(storageKey, this.password);
        document.cookie = `${storageKey}=${this.password}; SameSite=None; Secure`;
        this.ensurePasswordResolver();
      });

      return await new Promise((resolve) => (this.ensurePasswordResolver = resolve));
    }

    return Promise.resolve;
  }

  async deriveKeyPair() {
    const normalized = encoder.encode(this.password.normalize("NFKC"));
    const salt = encoder.encode(this.humanId);
    const derived = await scrypt.scrypt(normalized, salt, 128, 8, 1, 32);

    this.keyPair = nacl.box.keyPair.fromSecretKey(derived);
  }

  async deriveKeyPairSig() {
    const normalized = encoder.encode(this.password.normalize("NFKC"));
    const salt = encoder.encode("");
    const derived = await scrypt.scrypt(normalized, salt, 128, 8, 1, 32);

    this.keyPairSig = nacl.sign.keyPair.fromSeed(derived);
  }

  async sign(message) {
    const consented = await this.#openDialog(
      "consent",
      `
      <strong>Data access request</strong>
      <p><small>from ${this.parentUrl}</small></p>
      <pre>${message}</pre>
    `
    );

    if (consented) {
      return nacl.sign.detached(message, this.keyPairSig.secretKey);
    } else {
      return null;
    }
  }

  verifySig(message, signature, signerPublicKey) {
    return nacl.sign.detached.verify(message, signature, signerPublicKey);
  }

  encrypt(plaintext, receiverPublicKey) {
    const nonce = nacl.randomBytes(nacl.box.nonceLength);
    plaintext = StableUtf8.encode(plaintext);

    const encrypted = nacl.box(plaintext, nonce, receiverPublicKey, this.keyPair.secretKey);

    const fullMessage = new Uint8Array(nonce.length + encrypted.length);
    fullMessage.set(nonce);
    fullMessage.set(encrypted, nonce.length);

    return StableBase64.encode(fullMessage);
  }

  decrypt(ciphertextBase64, senderPublicKey) {
    // FIXME
    // stub for sender's public key
    // (new database schema TK)
    try {
      senderPublicKey = this.keyPair.publicKey;

      const ciphertext = StableBase64.decode(ciphertextBase64);
      const nonce = ciphertext.slice(0, nacl.box.nonceLength);
      const message = ciphertext.slice(nacl.box.nonceLength, ciphertext.length);

      const decryptedMessage = nacl.box.open(message, nonce, senderPublicKey, this.keyPair.secretKey);

      return StableUtf8.decode(decryptedMessage);
    } catch (e) {
      return null;
    }
  }

  messageParent(message) {
    window.parent.postMessage(message, this.parentUrl);
  }

  #listenToRequests() {
    window.addEventListener("message", async (event) => {
      const isFromParent = event.origin === this.parentUrl;
      if (!isFromParent) {
        return;
      }

      try {
        const [requestName, requestData] = Object.entries(event.data).flat();
        const { password, message, signature, signerPublicKey, receiverPublicKey } = requestData;

        const paramBuilder = {
          isReady: () => [],
          keys: () => [],
          sign: () => [message],
          verifySig: () => [message, signature, signerPublicKey],
          encrypt: () => [message, StableBase64.decode(receiverPublicKey)],
          decrypt: () => [message],
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
        event.ports[0].close();
      }
    });
  }

  async #openDialog(intent, message) {
    const popupConfig = Object.entries({
      popup: 1,
      top: 200,
      left: 200,
      width: 250,
      height: 300,
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
