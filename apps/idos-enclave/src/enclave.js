import scrypt from "scrypt-js";
import nacl from "tweetnacl";
import * as StableBase64 from "@stablelib/base64";
import * as StableUtf8 from "@stablelib/utf8";

const dialogName = "idos-dialog";

export class Enclave {
  constructor(options) {
    this.parentUrl = options.parentUrl;
    this.humanId = options.humanId;
  }

  async init() {
    try {
      window.addEventListener("message", (event) => {
        const isFromParent = event.origin === this.parentUrl;
        const isFromDialog = event.origin === this.dialog?.origin && event.source.name === dialogName;

        if (!isFromParent && !isFromDialog) {
          return;
        }

        const request = Object.keys(event.data)[0];
        const requestData = Object.values(event.data)[0];

        switch (request) {
          case "dialog":
            this.ensurePasswordResolver(requestData.password);
            break;
          case "encrypt":
            this.#messageParent({
              encrypted: this.#encrypt(requestData.message, StableBase64.decode(requestData.receiverPublicKey)),
            });
            break;
          case "decrypt":
            this.#messageParent({
              decrypted: this.#decrypt(requestData.message),
            });
            break;
          default:
            console.log("Unexpected request: ", event);
        }
      });

      await this.#ensurePassword();
      await this.#deriveKeyPair();
      const publicKey = StableBase64.encode(this.keyPair.publicKey);
      this.#messageParent({ publicKey });
    } catch (e) {
      this.#messageParent(e?.message);
    }
  }

  // FIXME
  // using both storage mediums because different browsers
  // handle sandboxed cross-origin iframes differently
  // wrt localstorage and cookies
  async #ensurePassword() {
    const storageKey = "idos-password";

    this.password = window.localStorage.getItem(storageKey) || document.cookie.match(`.*${storageKey}=(.*);`)?.at(0);

    if (!this.password) {
      this.dialog = window.open(
        "/dialog.html",
        dialogName,
        Object.entries({
          popup: 1,
          top: 200,
          left: 200,
          width: 250,
          height: 300,
        })
          .map((feat) => feat.join("="))
          .join(",")
      );

      return new Promise((resolve) => (this.ensurePasswordResolver = resolve)).then((passwordData) => {
        this.password = passwordData.string;
        // TODO
        // passwordData.duration
        window.localStorage.setItem(storageKey, this.password);
        document.cookie = `${storageKey}=${this.password}; SameSite=None; Secure`;
        this.dialog.close();
      });
    }
  }

  async #deriveKeyPair() {
    const encoder = new TextEncoder();

    const normalized = encoder.encode(this.password.normalize("NFKC"));
    const salt = encoder.encode(this.humanId);
    const derived = await scrypt.scrypt(normalized, salt, 128, 8, 1, 32);

    this.keyPair = nacl.box.keyPair.fromSecretKey(derived);
  }

  #encrypt(plaintext, receiverPublicKey) {
    const nonce = nacl.randomBytes(nacl.box.nonceLength);
    plaintext = StableUtf8.encode(plaintext);

    const encrypted = nacl.box(plaintext, nonce, receiverPublicKey, this.keyPair.secretKey);

    const fullMessage = new Uint8Array(nonce.length + encrypted.length);
    fullMessage.set(nonce);
    fullMessage.set(encrypted, nonce.length);

    return StableBase64.encode(fullMessage);
  }

  #decrypt(ciphertextBase64, senderPublicKey) {
    // FIXME
    // stub for sender's public key
    // (new database schema TK)
    senderPublicKey = this.keyPair.publicKey;

    const ciphertext = StableBase64.decode(ciphertextBase64);
    const nonce = ciphertext.slice(0, nacl.box.nonceLength);
    const message = ciphertext.slice(nacl.box.nonceLength, ciphertext.length);

    const decryptedMessage = nacl.box.open(message, nonce, senderPublicKey, this.keyPair.secretKey);

    return StableUtf8.decode(decryptedMessage);
  }

  #messageParent(message) {
    window.parent.postMessage(message, this.parentUrl);
  }
}
