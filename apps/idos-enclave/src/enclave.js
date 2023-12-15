import { Store } from "@idos-network/idos-store";
import * as Base64Codec from "@stablelib/base64";
import * as Utf8Codec from "@stablelib/utf8";
import nacl from "tweetnacl";
import { idOSKeyDerivation } from "./idOSKeyDerivation";

export class Enclave {
  constructor({ parentOrigin }) {
    this.parentOrigin = parentOrigin;

    this.store = new Store();
    this.storeBase64 = this.store.pipeCodec(Base64Codec);

    let secretKey = this.storeBase64.get("encryption-private-key");
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
      encryptionPublicKey: this.storeBase64.get("encryption-public-key"),
      humanId: this.store.get("human-id"),
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
    const existingPassword = this.store.get("password");
    if (existingPassword) {
      return Promise.resolve;
    }

    const humanId = this.store.get("human-id");
    let password, duration, credentialId;

    const getWebAuthnCredential = async (storedCredentialId) => {
      let credentialRequest = {
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
      password = Utf8Codec.decode(
        new Uint8Array(credential.response.userHandle)
      );
      credentialId = Base64Codec.encode(new Uint8Array(credential.rawId));

      return { password, credentialId };
    };

    return new Promise(async (resolve) => {
      if (usePasskeys === "webauthn") {
        const storedCredentialId = this.store.get("credential-id");
        if (storedCredentialId) {
          try {
            ({ password, credentialId } =
              await getWebAuthnCredential(storedCredentialId));
          } catch (e) {
            ({ password, credentialId } = await this.#requestToApp("passkey", {
              type: "webauthn"
            }));
          }
        } else {
          ({ password, credentialId } = await this.#requestToApp("passkey", {
            type: "webauthn"
          }));
        }
        this.store.set("credential-id", credentialId);
      } else if (usePasskeys === "password") {
        this.messageParent("GIMME passkey PASSWORD BABY");
        ({ password } = await this.#requestToApp("passkey", {
          type: "password"
        }));
      } else {
        ({ password, duration } = await this.#requestToApp("password"));

        this.store.set("password", password, duration);
      }

      resolve();
    });
  }

  async ensureKeyPair() {
    const password = await this.store.get("password");
    const salt = await this.store.get("human-id");

    let secretKey =
      (await this.storeBase64.get("encryption-private-key")) ||
      (await idOSKeyDerivation({ password, salt }));

    this.keyPair = nacl.box.keyPair.fromSecretKey(secretKey);

    await this.storeBase64.set(
      "encryption-private-key",
      this.keyPair.secretKey
    );
    await this.storeBase64.set("encryption-public-key", this.keyPair.publicKey);
  }

  encrypt(message, receiverPublicKey) {
    receiverPublicKey = receiverPublicKey || this.keyPair.publicKey;
    const nonce = nacl.randomBytes(nacl.box.nonceLength);

    const encrypted = nacl.box(
      message,
      nonce,
      receiverPublicKey,
      this.keyPair.secretKey
    );

    if (encrypted == null)
      throw Error(
        `Couldn't encrypt. ${JSON.stringify(
          {
            message: Base64Codec.encode(message),
            nonce: Base64Codec.encode(nonce),
            receiverPublicKey: Base64Codec.encode(receiverPublicKey),
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
    if (!this.keyPair) throw new Error("No key pair");

    senderPublicKey = senderPublicKey || this.keyPair.publicKey;

    const nonce = fullMessage.slice(0, nacl.box.nonceLength);
    const message = fullMessage.slice(nacl.box.nonceLength, fullMessage.length);

    const decrypted = nacl.box.open(
      message,
      nonce,
      senderPublicKey,
      this.keyPair.secretKey
    );

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
    console.log(`enclave#confirm: message: ${JSON.stringify(message)}`);
    return new Promise(async (resolve) => {
      const { confirmed } = await this.#requestToApp("confirm", {
        message,
        origin: this.parentOrigin
      });

      resolve(confirmed);
    });
  }

  messageParent(message) {
    window.parent.postMessage(message, this.parentOrigin);
  }

  #listenToRequests() {
    window.addEventListener("message", async (event) => {
      if (event.origin !== this.parentOrigin) return;

      if (event.data.action) {
        if (
          event.data.action === "confirm" &&
          event.data.message === "OH YEAH!!!"
        ) {
          console.log(
            "app->enclave: ENCLAVE IS CONFIRMING THAT IT'S CONSENTED"
          );

          this.messageParent(event.data);
          return;
        }
        console.log(`app->enclave: ${JSON.stringify(event.data)}`);
        this.respondToEnclave({ result: { confirmed } });

        return;
      }

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
          usePasskeys,
          password
        } = requestData;

        const paramBuilder = {
          confirm: () => [message],
          setPassword: () => [password],
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
        event.ports[0].postMessage({ error: e });
      } finally {
        event.ports[0].close();
      }
    });
  }

  async setPassword(password) {
    this.store.set("password", password);

    const salt = await this.store.get("human-id");

    const secretKey =
      (await this.storeBase64.get("encryption-private-key")) ||
      (await idOSKeyDerivation({ password, salt }));

    this.keyPair = nacl.box.keyPair.fromSecretKey(secretKey);

    return this.keyPair.publicKey;
  }

  async #requestToApp(intent, message) {
    return new Promise((resolve, reject) => {
      const { port1, port2 } = new MessageChannel();
      port1.onmessage = ({ data: { error, result } }) => {
        port1.close();

        error ? reject(error) : resolve(result);
      };

      this.messageParent({ intent, message }, this.parentOrigin.origin, [
        port2
      ]);
    });
  }
}
