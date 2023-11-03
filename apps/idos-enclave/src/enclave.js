import { Store } from "@idos-network/idos-store";
import * as Base64Codec from "@stablelib/base64";
import * as Utf8Codec from "@stablelib/utf8";
import { idOSKeyDerivation } from "./idOSKeyDerivation";
import nacl from "tweetnacl";

export class Enclave {
  constructor({ parentOrigin }) {
    this.parentOrigin = parentOrigin;
    this.passwordButton = document.querySelector("button#password");
    this.consentButton = document.querySelector("button#consent");
    this.store = new Store();

    const storeWithCodec = this.store.pipeCodec(Base64Codec);
    let secretKey = storeWithCodec.get("encryption-private-key")
    if (secretKey) this.keyPair = nacl.box.keyPair.fromSecretKey(secretKey);

    this.#listenToRequests();
  }

  reset() {
    this.store.reset();
  }

  storage(humanId, signerAddress, signerPublicKey) {
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

  async keys(usePasskeys) {
    this.usePasskeys = usePasskeys;

    await this.ensurePassword();
    await this.ensureKeyPair();

    return this.keyPair.publicKey;
  }

  async ensurePassword() {
    if (!this.store.get("password")) {
      this.passwordButton.style.display = "block";
      this.passwordButton.addEventListener("click", async (e) => {
        this.passwordButton.disabled = true;
        let password, duration, credentialId;
        try {
          if (this.usePasskeys) {

            console.warn("checking if one exists...");
            const challenge = crypto.getRandomValues(new Uint8Array(10));

            credentialId = this.store.get("credential-id");

            let credential;
            let publicKey;
            try {
              publicKey = {
                challenge: challenge,
                //rpId: "idos.network",
              }

              if (credentialId !== null) {
                publicKey.allowCredentials = [{
                  id: Base64Codec.decode(credentialId),
                  type: "public-key",
                }];
              }

              credential = await navigator.credentials.get({ publicKey });

              if (credential !== null) {
                console.warn("already exists");
                password = new TextDecoder().decode(credential.response.userHandle);
              }
              //({ password, duration, credentialId } = await this.#openDialog("passkey"));
            } catch (e) {
              // user cancelled passkey lookup; let's create one
              console.warn("no thanks i don't want to reuse");
              console.warn(e);
              ({ password, duration, credentialId } = await this.#openDialog("passkey"));
            }
          } else {
            ({ password, duration } = await this.#openDialog("password"));
          }


          this.store.set("credential-id", credentialId);
          this.store.set("password", password, duration);
          this.ensurePasswordResolver();
        } catch(e) {
          throw(e);
          this.passwordButton.disabled = false;
        }
      });

      return await new Promise((resolve) => this.ensurePasswordResolver = resolve);
    }

    return Promise.resolve;
  }

  async ensureKeyPair() {
    const password = this.store.get("password");
    const salt = this.store.get("human-id");

    const storeWithCodec = this.store.pipeCodec(Base64Codec);

    let secretKey = storeWithCodec.get("encryption-private-key")
      || await idOSKeyDerivation({ password, salt });

    this.keyPair = nacl.box.keyPair.fromSecretKey(secretKey);

    storeWithCodec.set("encryption-private-key", this.keyPair.secretKey);
    storeWithCodec.set("encryption-public-key", this.keyPair.publicKey);
  }

  encrypt(message, receiverPublicKey) {
    receiverPublicKey = receiverPublicKey || this.keyPair.publicKey;
    const nonce = nacl.randomBytes(nacl.box.nonceLength);

    const encrypted =
      nacl.box(message, nonce, receiverPublicKey, this.keyPair.secretKey);

    if (encrypted == null)
      throw Error(`Couldn't encrypt. ${JSON.stringify({
        message: Base64Codec.encode(message),
        nonce: Base64Codec.encode(nonce),
        senderPublicKey: Base64Codec.encode(senderPublicKey),
        localPublicKey: Base64Codec.encode(this.keyPair.publicKey),
      }, null, 2)}`);

    const fullMessage = new Uint8Array(nonce.length + encrypted.length);
    fullMessage.set(nonce, 0);
    fullMessage.set(encrypted, nonce.length);

    return fullMessage;
  }

  decrypt(fullMessage, senderPublicKey) {
    const nonce = fullMessage.slice(0, nacl.box.nonceLength);
    const message = fullMessage.slice(nacl.box.nonceLength, fullMessage.length);

    const decrypted =
      nacl.box.open(message, nonce, senderPublicKey, this.keyPair.secretKey);


    if (decrypted == null) {
      throw Error(`Couldn't decrypt. ${JSON.stringify({
        fullMessage: Base64Codec.encode(fullMessage),
        message: Base64Codec.encode(message),
        nonce: Base64Codec.encode(nonce),
        senderPublicKey: Base64Codec.encode(senderPublicKey),
        localPublicKey: Base64Codec.encode(this.keyPair.publicKey),
      }, null, 2)}`);
    }

    return decrypted;
  }

  async confirm(message) {
    this.consentButton.style.display = "block";
    this.consentButton.addEventListener("click", async (e) => {
      this.consentButton.disabled = true;

      try {
        const { consent } = await this.#openDialog(
          "consent",
          `
          <strong>Consent request</strong>
          <p><small>from ${this.parentOrigin}</small></p>
          <hr>
          <p><code>${message}</code></p>
        `
        );

        this.ensureConsentResolver(consent);
      } catch (e) {
        this.consentButton.disabled = false;
      }
    });

    return await new Promise((resolve) => this.ensureConsentResolver = resolve);
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
          fullMessage,
          signerPublicKey,
          signerAddress,
          senderPublicKey,
          receiverPublicKey,
          usePasskeys,
        } = requestData;

        const paramBuilder = {
          reset: () => [],
          storage: () => [humanId, signerAddress, signerPublicKey],
          keys: () => [usePasskeys],
          encrypt: () => [message, receiverPublicKey],
          decrypt: () => [fullMessage, senderPublicKey],
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
    const width = intent === "passkey" ? 500 : 250;
    const left = window.screen.width - width;

    const popupConfig = Object.entries({
      popup: 1,
      top: 0,
      left,
      width,
      height: 350,
    })
      .map(feat => feat.join("="))
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
