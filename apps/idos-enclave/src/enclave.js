import { Store } from "@idos-network/idos-store";
import * as Base64Codec from "@stablelib/base64";
import * as Utf8Codec from "@stablelib/utf8";
import nacl from "tweetnacl";
import { idOSKeyDerivation } from "./idOSKeyDerivation";

export class Enclave {
  constructor({ parentOrigin }) {
    this.parentOrigin = parentOrigin;
    this.store = new Store();

    this.unlockButton = document.querySelector("button#unlock");
    this.confirmButton = document.querySelector("button#confirm");

    const storeWithCodec = this.store.pipeCodec(Base64Codec);
    const secretKey = storeWithCodec.get("encryption-private-key");
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
      signerPublicKey: this.store.get("signer-public-key")
    };
  }

  async keys(usePasskeys = false) {
    await this.ensurePassword(usePasskeys);
    await this.ensureKeyPair();

    return this.keyPair.publicKey;
  }

  async ensurePassword(usePasskeys) {
    if (this.store.get("password")) return Promise.resolve;

    this.unlockButton.style.display = "block";
    this.unlockButton.disabled = false;

    const humanId = this.store.get("human-id");
    let password, duration, credentialId;

    const getWebAuthnCredential = async (storedCredentialId) => {
      const credentialRequest = {
        publicKey: {
          challenge: crypto.getRandomValues(new Uint8Array(10)),
          allowCredentials: [
            {
              type: "public-key",
              id: Base64Codec.decode(storedCredentialId)
            }
          ]
        }
      };

      const credential = await navigator.credentials.get(credentialRequest);
      password = Utf8Codec.decode(new Uint8Array(credential.response.userHandle));
      credentialId = Base64Codec.encode(new Uint8Array(credential.rawId));

      return { password, credentialId };
    };

    return new Promise(async (resolve) =>
      this.unlockButton.addEventListener("click", async (e) => {
        this.unlockButton.disabled = true;

        if (usePasskeys === "webauthn") {
          const storedCredentialId = this.store.get("credential-id");
          if (storedCredentialId) {
            try {
              ({ password, credentialId } = await getWebAuthnCredential(storedCredentialId));
            } catch (e) {
              ({ password, credentialId } = await this.#openDialog("passkey", {
                type: "webauthn"
              }));
            }
          } else {
            ({ password, credentialId } = await this.#openDialog("passkey", {
              type: "webauthn"
            }));
          }
          this.store.set("credential-id", credentialId);
        } else if (usePasskeys === "password") {
          ({ password } = await this.#openDialog("passkey", {
            type: "password"
          }));
        } else {
          ({ password, duration } = await this.#openDialog("password"));
        }

        this.store.set("password", password, duration);

        resolve();
      })
    );
  }

  async ensureKeyPair() {
    const password = this.store.get("password");
    const salt = this.store.get("human-id");

    const storeWithCodec = this.store.pipeCodec(Base64Codec);

    const secretKey =
      storeWithCodec.get("encryption-private-key") || (await idOSKeyDerivation({ password, salt }));

    this.keyPair = nacl.box.keyPair.fromSecretKey(secretKey);

    storeWithCodec.set("encryption-private-key", this.keyPair.secretKey);
    storeWithCodec.set("encryption-public-key", this.keyPair.publicKey);
  }

  encrypt(message, receiverPublicKey) {
    receiverPublicKey = receiverPublicKey || this.keyPair.publicKey;
    const nonce = nacl.randomBytes(nacl.box.nonceLength);

    const encrypted = nacl.box(message, nonce, receiverPublicKey, this.keyPair.secretKey);

    if (encrypted == null)
      throw Error(
        `Couldn't encrypt. ${JSON.stringify(
          {
            message: Base64Codec.encode(message),
            nonce: Base64Codec.encode(nonce),
            senderPublicKey: Base64Codec.encode(senderPublicKey),
            localPublicKey: Base64Codec.encode(this.keyPair.publicKey)
          },
          null,
          2
        )}`
      );

    const fullMessage = new Uint8Array(nonce.length + encrypted.length);
    fullMessage.set(nonce, 0);
    fullMessage.set(encrypted, nonce.length);

    return fullMessage;
  }

  decrypt(fullMessage, senderPublicKey) {
    const nonce = fullMessage.slice(0, nacl.box.nonceLength);
    const message = fullMessage.slice(nacl.box.nonceLength, fullMessage.length);

    const decrypted = nacl.box.open(message, nonce, senderPublicKey, this.keyPair.secretKey);

    if (decrypted == null) {
      throw Error(
        `Couldn't decrypt. ${JSON.stringify(
          {
            fullMessage: Base64Codec.encode(fullMessage),
            message: Base64Codec.encode(message),
            nonce: Base64Codec.encode(nonce),
            senderPublicKey: Base64Codec.encode(senderPublicKey),
            localPublicKey: Base64Codec.encode(this.keyPair.publicKey)
          },
          null,
          2
        )}`
      );
    }

    return decrypted;
  }

  async confirm(message) {
    this.confirmButton.style.display = "block";
    this.confirmButton.disabled = false;

    return new Promise((resolve) =>
      this.confirmButton.addEventListener("click", async (e) => {
        this.confirmButton.disabled = true;

        const { confirmed } = await this.#openDialog("confirm", {
          message,
          origin: this.parentOrigin
        });

        resolve(confirmed);
      })
    );
  }

  messageParent(message) {
    window.parent.postMessage(message, this.parentOrigin);
  }

  #listenToRequests() {
    window.addEventListener("message", async (event) => {
      if (event.origin !== this.parentOrigin) return;
      if (event.data.target === "metamask-inpage") return;

      try {
        const [requestName, requestData] = Object.entries(event.data).flat();
        const {
          fullMessage,
          humanId,
          message,
          receiverPublicKey,
          senderPublicKey,
          signerAddress,
          signerPublicKey,
          usePasskeys
        } = requestData;

        const paramBuilder = {
          confirm: () => [message],
          decrypt: () => [fullMessage, senderPublicKey],
          encrypt: () => [message, receiverPublicKey],
          keys: () => [usePasskeys],
          reset: () => [],
          storage: () => [humanId, signerAddress, signerPublicKey]
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
        this.unlockButton.style.display = "none";
        this.confirmButton.style.display = "none";
        event.ports[0].close();
      }
    });
  }

  async #openDialog(intent, message) {
    const width = intent === "passkey" ? 450 : 250;
    const height = intent === "passkey" ? 100 : 350;
    const left = window.screen.width - width;

    const popupConfig = Object.entries({
      height,
      left,
      popup: 1,
      top: 0,
      width
    })
      .map((feat) => feat.join("="))
      .join(",");

    const dialogURL = new URL("/dialog.html", window.location.origin);
    this.dialog = window.open(dialogURL, "idos-dialog", popupConfig);

    await new Promise((resolve) => this.dialog.addEventListener("load", resolve));

    return new Promise((resolve, reject) => {
      const { port1, port2 } = new MessageChannel();
      port1.onmessage = ({ data: { error, result } }) => {
        port1.close();
        this.dialog.close();
        error ? reject(error) : resolve(result);
      };
      this.dialog.postMessage({ intent, message }, this.dialog.origin, [port2]);
    });
  }
}
