import scrypt from "scrypt-js";
import nacl from "tweetnacl";
import * as StableBase64 from "@stablelib/base64";
import * as StableUtf8 from "@stablelib/utf8";

const dialogPath = "/dialog.html";
const dialogName = "idos-dialog";
const storageKey = "idos-password";
const encoder = new TextEncoder();

export class Enclave {
  constructor(options) {
    this.parentUrl = options.parentUrl;
    this.humanId = options.humanId;
  }

  async init() {
    this.listenToParent();
    this.listenToDialog();

    await this.ensurePassword();
    await this.deriveKeyPair();
    await this.deriveKeyPairSig();

    this.messageParent({
      publicKeys: {
        encryption: {
          base64: StableBase64.encode(this.keyPair.publicKey),
          raw: this.keyPair.publicKey,
        },
        sig: {
          base64: StableBase64.encode(this.keyPairSig.publicKey),
          raw: this.keyPairSig.publicKey,
        }
      }
    });
  }

  // TODO
  // passwordData.duration
  // FIXME
  // using both storage mediums because different browsers
  // handle sandboxed cross-origin iframes differently
  // wrt localstorage and cookies
  async ensurePassword() {
    this.password = this.password
      || window.localStorage.getItem(storageKey)
      || document.cookie.match(`.*${storageKey}=(.*);`)?.at(0);

    if (!this.password) {
      this.messageParent({ showEnclave: null });

      document.querySelector("#start").addEventListener("click", async (e) => {
        this.password = (await this.askPassword()).string;
        window.localStorage.setItem(storageKey, this.password);
        document.cookie = `${storageKey}=${this.password}; SameSite=None; Secure`;
        this.ensurePasswordResolver();
    });

      return await new Promise(resolve => this.ensurePasswordResolver = resolve);
    }

    return Promise.resolve();
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
    const consented = await this.askConsent(`
      <strong>Data access request</strong>
      <p><small>from ${this.parentUrl}</small></p>
      <pre>${message}</pre>
    `);

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

      const decryptedMessage = nacl.box.open(message, nonce, senderPublicKey, this.keyPair.secretKey)

      return StableUtf8.decode(decryptedMessage);
    } catch (e) {
      return null;
    }
  }

  messageParent(message) {
    window.parent.postMessage(message, this.parentUrl);
  }

  listenToParent() {
    window.addEventListener("message", async (event) => {
      const isFromParent = event.origin === this.parentUrl;
      if (!isFromParent) { return; }

      const [requestName, requestData] = Object.entries(event.data).flat();
      const { password, message, signature, signerPublicKey, receiverPublicKey } = requestData;

      const response = {
        sign: () => ({ signed: [message] }),
        verifySig: () => ({ verifiedSig: [message, signature, signerPublicKey] }),
        encrypt: () => ({ encrypted: [message, StableBase64.decode(receiverPublicKey)] }),
        decrypt: () => ({ decrypted: [message] }),
      }[requestName];

      if (!response) {
        throw new Error(`Unexpected request from parent: ${requestName}`);
      }

      const [responseName, callArgs] = Object.entries(response()).flat();
      this.messageParent({ [responseName]: await this[requestName](...callArgs) });
    });
  };

  listenToDialog() {
    window.addEventListener("message", (event) => {
      const isFromDialog = event.origin === this.dialog?.origin
        && event.source.name === dialogName;

      if (!isFromDialog) { return; }

      const [requestName, requestData] = Object.entries(event.data).flat();
      const { password, consent } = requestData;

      switch(requestName) {
        case "passworded":
          this.askPasswordResolver(password);
          break;
        case "consented":
          this.askConsentResolver(consent);
          break;
        default:
          throw new Error(`Unexpected request from dialog: ${requestName}`);
      }

      this.dialog.close();
    });
  };

  openDialog(intent, message) {
    const popupConfig = Object.entries({
      popup: 1,
      top: 200,
      left: 200,
      width: 250,
      height: 300,
    }).map(feat => feat.join("=")).join(",");

    const dialogURL = new URL(dialogPath, window.location.origin);
    dialogURL.search = new URLSearchParams({ intent, message });

    this.dialog = window.open(dialogURL, dialogName, popupConfig);
  }

  async askPassword() {
    this.openDialog("password");

    return await new Promise(resolve => this.askPasswordResolver = resolve);
  }

  async askConsent(message) {
    this.openDialog("consent", message);

    return await new Promise(resolve => this.askConsentResolver = resolve);
  }
}
