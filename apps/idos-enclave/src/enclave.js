import { Store } from "@idos-network/idos-store";
import * as StableBase64 from "@stablelib/base64";
import * as StableUtf8 from "@stablelib/utf8";
import scrypt from "scrypt-js";
import nacl from "tweetnacl";

const encoder = new TextEncoder();

export class Enclave {
  constructor({ parentOrigin }) {
    this.parentOrigin = parentOrigin;
    this.store = new Store({
      initWith: ["human-id", "password", "signer-public-key"]
    });
    this.#listenToRequests();
  }

  async reset(keep) {
    this.store.reset(keep);
  }

  async isReady() {
    return !!this.store.get("password");
  }

  async storage(humanId, signerPublicKey) {
    if (humanId) {
      this.store.set("human-id", humanId);
    }

    if (signerPublicKey) {
      this.store.set("signer-public-key", signerPublicKey);
    }

    return {
      humanId: this.store.get("human-id"),
      signerPublicKey: this.store.get("signer-public-key")
    };
  }

  async keys() {
    await this.ensurePassword();
    await this.deriveKeyPair();
    await this.deriveKeyPairSig();

    return {
      encryption: {
        base64: StableBase64.encode(this.keyPair.publicKey),
        raw: this.keyPair.publicKey
      },
      sig: {
        base64: StableBase64.encode(this.keyPairSig.publicKey),
        raw: this.keyPairSig.publicKey
      }
    };
  }

  // @todo: add `passwordData.duration`
  // @fixme
  // using both storage mediums because different browsers
  // handle sandboxed cross-origin iframes differently
  // wrt localstorage and cookies
  async ensurePassword() {
    if (!this.store.get("password")) {
      document.querySelector("#start").addEventListener("click", async (e) => {
        this.store.set("password", (await this.#openDialog("password")).string);
        this.ensurePasswordResolver();
      });
      return await new Promise(
        (resolve) => (this.ensurePasswordResolver = resolve)
      );
    }
    return Promise.resolve;
  }

  async deriveKeyPair() {
    const normalized = encoder.encode(
      this.store.get("password").normalize("NFKC")
    );
    const salt = encoder.encode(this.store.get("human-id"));
    const derived = await scrypt.scrypt(normalized, salt, 128, 8, 1, 32);
    this.keyPair = nacl.box.keyPair.fromSecretKey(derived);
  }

  async deriveKeyPairSig() {
    const normalized = encoder.encode(
      this.store.get("password").normalize("NFKC")
    );
    const salt = encoder.encode("");
    const derived = await scrypt.scrypt(normalized, salt, 128, 8, 1, 32);
    this.keyPairSig = nacl.sign.keyPair.fromSeed(derived);
  }

  async sign(message) {
    const displayMessage =
      typeof message === "string" ? message : StableUtf8.decode(message);
    const consented = await this.#openDialog(
      "consent",
      `
      <strong>Data access request</strong>
      <p><small>from ${this.parentOrigin}</small></p>
      <pre>${displayMessage}</pre>
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
          password,
          message,
          signature,
          signerPublicKey,
          senderPublicKey,
          receiverPublicKey,
          keep,
        } = requestData;

        const paramBuilder = {
          reset: () => [keep],
          storage: () => [humanId, signerPublicKey],
          isReady: () => [],
          keys: () => [],
          sign: () => [message],
          verifySig: () => [message, signature, signerPublicKey],
          encrypt: () => [message, receiverPublicKey],
          decrypt: () => [message, senderPublicKey]
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
