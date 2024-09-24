import { Store } from "@idos-network/idos-store";
import * as Base64Codec from "@stablelib/base64";
import * as Utf8Codec from "@stablelib/utf8";
import { every, get, negate } from "lodash-es";
import nacl from "tweetnacl";

import { idOSKeyDerivation } from "./idOSKeyDerivation";

export class Enclave {
  constructor({ parentOrigin }) {
    this.parentOrigin = parentOrigin;
    this.store = new Store();
    this.authorizedOrigins = JSON.parse(this.store.get("enclave-authorized-origins") ?? "[]");

    this.unlockButton = document.querySelector("button#unlock");
    this.confirmButton = document.querySelector("button#confirm");

    const storeWithCodec = this.store.pipeCodec(Base64Codec);
    const secretKey = storeWithCodec.get("encryption-private-key");
    if (secretKey) this.keyPair = nacl.box.keyPair.fromSecretKey(secretKey);

    this.#listenToRequests();
  }

  get isAuthorizedOrigin() {
    return this.authorizedOrigins.includes(this.parentOrigin);
  }

  reset() {
    this.store.reset();
  }

  storage(humanId, signerAddress, signerPublicKey, expectedUserEncryptionPublicKey) {
    humanId && this.store.set("human-id", humanId);
    signerAddress && this.store.set("signer-address", signerAddress);
    signerPublicKey && this.store.set("signer-public-key", signerPublicKey);

    const storeWithCodec = this.store.pipeCodec(Base64Codec);
    this.expectedUserEncryptionPublicKey = expectedUserEncryptionPublicKey;

    if (!this.isAuthorizedOrigin) {
      return {
        humanId: "",
        encryptionPublicKey: "",
        signerAddress: "",
        signerPublicKey: "",
      };
    }

    return {
      humanId: this.store.get("human-id"),
      encryptionPublicKey: storeWithCodec.get("encryption-public-key"),
      signerAddress: this.store.get("signer-address"),
      signerPublicKey: this.store.get("signer-public-key"),
    };
  }

  async keys() {
    await this.ensurePassword();
    await this.ensureKeyPair();

    return this.keyPair?.publicKey;
  }

  async authWithPassword() {
    const { password, duration } = await this.#openDialog("password");
    this.store.set("password", password);
    this.store.setRememberDuration(duration);
    return { password, duration };
  }

  async ensurePassword() {
    if (this.isAuthorizedOrigin && this.store.get("password")) return Promise.resolve;

    this.unlockButton.style.display = "block";
    this.unlockButton.disabled = false;

    let password;
    let duration;
    let credentialId;

    const getWebAuthnCredential = async (storedCredentialId) => {
      const credentialRequestWithId = {
        publicKey: {
          challenge: crypto.getRandomValues(new Uint8Array(10)),
          allowCredentials: [
            {
              type: "public-key",
              id: Base64Codec.decode(storedCredentialId),
            },
          ],
        },
      };

      const credential = await navigator.credentials.get(credentialRequestWithId);
      password = Utf8Codec.decode(new Uint8Array(credential.response.userHandle));
      credentialId = Base64Codec.encode(new Uint8Array(credential.rawId));

      return { password, credentialId };
    };

    return new Promise((resolve, reject) =>
      this.unlockButton.addEventListener("click", async () => {
        this.unlockButton.disabled = true;

        const storedCredentialId = this.store.get("credential-id");
        const preferredAuthMethod = this.store.get("preferred-auth-method");

        try {
          if (storedCredentialId) {
            ({ password, credentialId } = await getWebAuthnCredential(storedCredentialId));
          } else if (preferredAuthMethod) {
            ({ password, duration } = await this.#openDialog(preferredAuthMethod));
          } else {
            ({ password, duration, credentialId } = await this.#openDialog("auth", {
              expectedUserEncryptionPublicKey: this.expectedUserEncryptionPublicKey,
            }));
          }
        } catch (e) {
          return reject(e);
        }

        this.store.set("password", password);

        this.authorizedOrigins = [...new Set([...this.authorizedOrigins, this.parentOrigin])];
        this.store.set("enclave-authorized-origins", JSON.stringify(this.authorizedOrigins));

        if (credentialId) {
          this.store.set("credential-id", credentialId);
          this.store.set("preferred-auth-method", "passkey");
        } else {
          this.store.set("preferred-auth-method", "password");
          this.store.setRememberDuration(duration);
        }

        return password ? resolve() : reject();
      }),
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

  encrypt(message, receiverPublicKey = this.keyPair.publicKey) {
    const nonce = nacl.randomBytes(nacl.box.nonceLength);
    const encrypted = nacl.box(message, nonce, receiverPublicKey, this.keyPair.secretKey);

    if (encrypted === null)
      throw Error(
        `Couldn't encrypt. ${JSON.stringify(
          {
            message: Base64Codec.encode(message),
            nonce: Base64Codec.encode(nonce),
            receiverPublicKey: Base64Codec.encode(receiverPublicKey),
            localPublicKey: Base64Codec.encode(this.keyPair.publicKey),
          },
          null,
          2,
        )}`,
      );

    const fullMessage = new Uint8Array(nonce.length + encrypted.length);
    fullMessage.set(nonce, 0);
    fullMessage.set(encrypted, nonce.length);

    return fullMessage;
  }

  async decrypt(fullMessage, senderPublicKey) {
    if (!this.keyPair) await this.keys();

    const nonce = fullMessage.slice(0, nacl.box.nonceLength);
    const message = fullMessage.slice(nacl.box.nonceLength, fullMessage.length);
    const decrypted = nacl.box.open(message, nonce, senderPublicKey, this.keyPair.secretKey);

    if (decrypted === null) {
      throw Error(
        `Couldn't decrypt. ${JSON.stringify(
          {
            fullMessage: Base64Codec.encode(fullMessage),
            message: Base64Codec.encode(message),
            nonce: Base64Codec.encode(nonce),
            senderPublicKey: Base64Codec.encode(senderPublicKey),
            localPublicKey: Base64Codec.encode(this.keyPair.publicKey),
          },
          null,
          2,
        )}`,
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
          origin: this.parentOrigin,
        });

        resolve(confirmed);
      }),
    );
  }

  async configure(mode, theme) {
    this.configuration = { mode, theme };

    if (mode === "new") {
      this.unlockButton.classList.add("create");
    } else {
      this.unlockButton.classList.remove("create");
    }
  }

  messageParent(message) {
    window.parent.postMessage(message, this.parentOrigin);
  }

  async filterCredentialsByCountries(credentials, countries) {
    const decrypted = await Promise.all(
      credentials.map(async (credential) => ({
        ...credential,
        content: Utf8Codec.decode(
          await this.decrypt(
            Base64Codec.decode(credential.content),
            Base64Codec.decode(credential.encryption_public_key),
          ),
        ),
      })),
    );

    return decrypted
      .filter((credential) => {
        const content = JSON.parse(credential.content);
        return countries.includes(content.credentialSubject.residential_address_country);
      })
      .map((credential) => credential.id);
  }

  async filterCredentials(credentials, privateFieldFilters) {
    const matchCriteria = (content, criteria) =>
      every(Object.entries(criteria), ([path, targetSet]) =>
        targetSet.includes(get(content, path)),
      );

    const decrypted = await Promise.all(
      credentials.map(async (credential) => ({
        ...credential,
        content: Utf8Codec.decode(
          await this.decrypt(
            Base64Codec.decode(credential.content),
            Base64Codec.decode(credential.encryption_public_key),
          ),
        ),
      })),
    );

    return decrypted
      .map((credential) => ({
        ...credential,
        content: JSON.parse(credential.content),
      }))
      .filter(({ content }) => matchCriteria(content, privateFieldFilters.pick))
      .filter(({ content }) => negate(() => matchCriteria(content, privateFieldFilters.omit)));
  }

  async backupPasswordOrSecret() {
    return this.#openDialog("backupPasswordOrSecret");
  }

  #listenToRequests() {
    window.addEventListener("message", async (event) => {
      if (event.origin !== this.parentOrigin || event.data.target === "metamask-inpage") return;

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
          mode,
          theme,
          credentials,
          countries,
          privateFieldFilters,
          expectedUserEncryptionPublicKey,
        } = requestData;

        const paramBuilder = {
          confirm: () => [message],
          decrypt: () => [fullMessage, senderPublicKey],
          encrypt: () => [message, receiverPublicKey],
          keys: () => [],
          reset: () => [],
          configure: () => [mode, theme],
          storage: () => [humanId, signerAddress, signerPublicKey, expectedUserEncryptionPublicKey],
          updateStore: () => [key, value],
          filterCredentialsByCountries: () => [credentials, countries],
          filterCredentials: () => [credentials, privateFieldFilters],
          backupPasswordOrSecret: () => [],
        }[requestName];

        if (!paramBuilder) throw new Error(`Unexpected request from parent: ${requestName}`);

        const response = await this[requestName](...paramBuilder());
        event.ports[0].postMessage({ result: response });
      } catch (error) {
        console.warn("catch", error);
        event.ports[0].postMessage({ error });
      } finally {
        this.unlockButton.style.display = "none";
        this.confirmButton.style.display = "none";
        event.ports[0].close();
      }
    });
  }

  async handleidOSStore(payload) {
    return new Promise((resolve, reject) => {
      const { port1, port2 } = new MessageChannel();
      port1.onmessage = async ({ data: { error, result } }) => {
        if (error) return reject(error);

        if (result.type === "idOS:store" && result.status === "success") {
          resolve(result);
          port1.close();
        }
      };

      window.parent.postMessage({ type: "idOS:store", payload }, this.parentOrigin, [port2]);
    });
  }

  async #openDialog(intent, message) {
    const width = 600;
    const height =
      this.configuration?.mode === "new" ? 600 : intent === "backupPasswordOrSecret" ? 520 : 400;
    const left = window.screen.width - width;

    const popupConfig = Object.entries({
      height,
      left,
      top: 0,
      popup: 1,
      width,
    })
      .map((feat) => feat.join("="))
      .join(",");

    const dialogURL = new URL(
      `/dialog.html?humanId=${this.store.get("human-id")}`,
      window.location.origin,
    );
    this.dialog = window.open(dialogURL, "idos-dialog", popupConfig);

    await new Promise((resolve) => this.dialog.addEventListener("ready", resolve, { once: true }));

    return new Promise((resolve, reject) => {
      const { port1, port2 } = new MessageChannel();
      port1.onmessage = async ({ data: { error, result } }) => {
        if (error) {
          this.unlockButton.disabled = false;
          this.confirmButton.disabled = false;
          return reject(error);
        }

        if (result.type === "idOS:store" && result.status === "pending") {
          result = await this.handleidOSStore(result.payload);

          return this.dialog.postMessage(
            {
              intent: "backupPasswordOrSecret",
              message: { status: "done" },
              configuration: this.configuration,
            },
            this.dialog.origin,
          );
        }

        port1.close();
        this.dialog.close();

        return resolve(result);
      };

      this.dialog.postMessage(
        { intent, message, configuration: this.configuration },
        this.dialog.origin,
        [port2],
      );
    });
  }
}
