import { Store } from "@idos-network/core";
import * as Base64Codec from "@stablelib/base64";
import * as Utf8Codec from "@stablelib/utf8";
import { negate } from "es-toolkit";
import { every, get } from "es-toolkit/compat";
import nacl from "tweetnacl";
import { Client as MPCClient } from "./mpc/Client";

import { idOSKeyDerivation } from "./idOSKeyDerivation";

export class Enclave {
  constructor({ parentOrigin }) {
    this.parentOrigin = parentOrigin;
    this.store = new Store(window.localStorage);
    this.authorizedOrigins = JSON.parse(this.store.get("enclave-authorized-origins") ?? "[]");

    this.unlockButton = document.querySelector("button#unlock");
    this.confirmButton = document.querySelector("button#confirm");
    this.backupButton = document.querySelector("button#backup");

    const storeWithCodec = this.store.pipeCodec(Base64Codec);
    const secretKey = storeWithCodec.get("encryption-private-key");
    if (secretKey) this.keyPair = nacl.box.keyPair.fromSecretKey(secretKey);

    this.mpcClient = new MPCClient(
      "https://partisia-reader-node.staging.idos.network:8080",
      "02fba53e60467a4babd20d007953a5dde1197463a4"
    )

    this.listenToRequests();
  }

  get isAuthorizedOrigin() {
    return this.authorizedOrigins.includes(this.parentOrigin);
  }

  reset() {
    this.store.reset();
  }

  safeParse(string) {
    try {
      const parsed = JSON.parse(string);
      return parsed;
    } catch (error) {
      return string;
    }
  }

  storage(userId, expectedUserEncryptionPublicKey) {
    // In case the user is different, we reset the store.
    if (userId !== this.store.get("user-id")) this.reset();

    userId && this.store.set("user-id", userId);
    const storeWithCodec = this.store.pipeCodec(Base64Codec);

    this.expectedUserEncryptionPublicKey = expectedUserEncryptionPublicKey;
    this.userId = userId;

    if (!this.isAuthorizedOrigin) {
      return {
        userId: "",
        encryptionPublicKey: "",
      };
    }

    return {
      // TODO Remove human-user migration code.
      userId: this.userId ?? this.store.get("user-id") ?? this.store.get("human-id"),
      encryptionPublicKey: storeWithCodec.get("encryption-public-key"),
    };
  }

  async keys() {
    console.log("keys")
    const storeWithCodec = this.store.pipeCodec(Base64Codec);
    var secretKey = storeWithCodec.get("encryption-private-key")

    if (!secretKey) {
      const preferredAuthMethod = await this.ensurePreferredAuthMethod()
      console.log({preferredAuthMethod});

      switch (preferredAuthMethod) {
        case "password":
          const password = await this.ensurePassword();
          const salt = this.userId;
          secretKey = await idOSKeyDerivation({ password, salt });
          break;
        case "mpc":
          secretKey = await this.ensureMPCPrivateKey();
          break;
      }
    }
    console.log({secretKey})

    await this.ensureKeyPair(secretKey);

    return this.keyPair?.publicKey;
  }

  async ensurePreferredAuthMethod() {
    console.log("ensurePreferredAuthMethod")
    const allowedAuthMethods = ["mpc", "password"]
    var authMethod = this.store.get("preferred-auth-method");
    if (authMethod) { return authMethod }

    this.unlockButton.style.display = "block";
    this.unlockButton.disabled = false;

    return new Promise((resolve, reject) =>
      this.unlockButton.addEventListener("click", async () => {
      this.unlockButton.disabled = true;

        try {
          ({authMethod} = await this.openDialog("auth", {}));

          if (!allowedAuthMethods.includes(authMethod)) {
            return reject(new Error(`Invalid auth method: ${authMethod}`));
          }
        } catch (e) {
          console.log("error in auth dialog", e)
          return reject(e);
        }
        this.store.set("preferred-auth-method", authMethod);

        return authMethod ? resolve(authMethod) : reject();
      }),
    );
  }

  async ensurePassword() {
    if (this.isAuthorizedOrigin && this.store.get("password")) return Promise.resolve;

    this.unlockButton.style.display = "block";
    this.unlockButton.disabled = false;

    let password;

    return new Promise((resolve, reject) =>
      this.unlockButton.addEventListener("click", async () => {
        this.unlockButton.disabled = true;

        try {
          ({ password } = await this.openDialog("password", {
            expectedUserEncryptionPublicKey: this.expectedUserEncryptionPublicKey,
          }));
        } catch (e) {
          return reject(e);
        }

        this.store.set("password", password);

        this.authorizedOrigins = [...new Set([...this.authorizedOrigins, this.parentOrigin])];
        this.store.set("enclave-authorized-origins", JSON.stringify(this.authorizedOrigins));

        return password ? resolve(password) : reject();
      }),
    );
  }

  async ensureKeyPair(secretKey) {
    console.log("ensureKeyPair");
    this.keyPair = nacl.box.keyPair.fromSecretKey(secretKey);

    const storeWithCodec = this.store.pipeCodec(Base64Codec);
    storeWithCodec.set("encryption-private-key", this.keyPair.secretKey);
    storeWithCodec.set("encryption-public-key", this.keyPair.publicKey);
  }

  async ensureMPCPrivateKey() {
    console.log("ensureMPCPrivateKey");
    if (this.configuration?.mode !== "new") {
      const { status: downloadStatus, secret: downloadedSecret } = await this.downloadSecret();
      if (downloadStatus === "ok") { return downloadedSecret }

      if (downloadStatus === "error") { throw Error("A secret might be stored at ZK nodes, but can't be obtained") }
    }

    const privateKey = nacl.box.keyPair().secretKey;
    const { status: uploadStatus } = await this.uploadSecret(privateKey)

    if (uploadStatus != "success") { throw Error(`A secret upload failed with status: ${uploadStatus}`) }

    return privateKey;
  }

  async downloadSecret() {
    console.log("downloadSecret");
    return new Promise((resolve, reject) => {
      const ephemeralKeyPair = nacl.box.keyPair();
      const signerAddress = this.configuration.walletAddress
      const downloadRequest = this.mpcClient.downloadRequest(signerAddress, ephemeralKeyPair.publicKey)
      const messageToSign = this.mpcClient.downloadMessageToSign(downloadRequest)

      const channel = new MessageChannel();
      channel.port1.onmessage = async (message) => {
        console.log("I-FRAME receives a message: ", message);
        channel.port1.close();
        const { status, secret } = await this.mpcClient.downloadSecret(this.userId, downloadRequest, message.data.data, ephemeralKeyPair.secretKey)

        return resolve({ status, secret })
      };

      const signMessage = {
        type: "idOS-MPC:signMessage",
        payload: messageToSign,
      }
      window.parent.postMessage(signMessage, this.parentOrigin, [channel.port2]);
    })
  }

  async uploadSecret(secret) {
    console.log("uploadSecret");
    return new Promise((resolve, reject) => {
      const signerAddress = this.configuration.walletAddress
      const blindedShares = this.mpcClient.getBlindedShares(secret)
      const uploadRequest = this.mpcClient.uploadRequest(blindedShares, signerAddress)
      const messageToSign = this.mpcClient.uploadMessageToSign(uploadRequest)

      const channel = new MessageChannel();
      channel.port1.onmessage = async (message) => {
        console.log("I-FRAME receives a message: ", message);
        channel.port1.close();
        const { status, secret } = await this.mpcClient.uploadSecret(this.userId, uploadRequest, message.data.data, blindedShares)

        return resolve({ status, secret: secret? secret.toString("utf8") : secret })
      };

      const signMessage = {
        type: "idOS-MPC:signMessage",
        payload: messageToSign,
      }
      window.parent.postMessage(signMessage, this.parentOrigin, [channel.port2]);
    })

  }

  encrypt(message, receiverPublicKey = this.keyPair.publicKey) {
    const nonce = nacl.randomBytes(nacl.box.nonceLength);
    const ephemeralKeyPair = nacl.box.keyPair();
    const encrypted = nacl.box(message, nonce, receiverPublicKey, ephemeralKeyPair.secretKey);

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

    return { content: fullMessage, encryptorPublicKey: ephemeralKeyPair.publicKey };
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

        const { confirmed } = await this.openDialog("confirm", {
          message,
          origin: this.parentOrigin,
        });

        resolve(confirmed);
      }),
    );
  }

  async configure(mode, theme, walletAddress) {
    this.configuration = { mode, theme, walletAddress };

    if (mode === "new") {
      this.unlockButton.classList.add("create");
    } else {
      this.unlockButton.classList.remove("create");
    }
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
            Base64Codec.decode(credential.encryptor_public_key),
          ),
        ),
      })),
    );

    return decrypted
      .map((credential) => ({
        ...credential,
        content: (() => {
          try {
            JSON.parse(credential.content);
          } catch (e) {
            throw new Error(`Credential ${credential.id} decrypted contents are not valid JSON`);
          }
        })(),
      }))
      .filter(({ content }) => matchCriteria(content, privateFieldFilters.pick))
      .filter(({ content }) => negate(() => matchCriteria(content, privateFieldFilters.omit)));
  }

  async backupPasswordOrSecret() {
    this.backupButton.style.display = "block";
    this.backupButton.disabled = false;
    return new Promise((resolve, reject) => {
      this.backupButton.addEventListener("click", async () => {
        try {
          this.backupButton.disabled = true;
          await this.openDialog("backupPasswordOrSecret", {
            expectedUserEncryptionPublicKey: this.expectedUserEncryptionPublicKey,
          });
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  listenToRequests() {
    window.addEventListener("message", async (event) => {
      if (
        event.origin !== this.parentOrigin ||
        // cspell:disable-next-line
        event.data.target === "metamask-inpage"
      )
        return;

      try {
        const [requestName, requestData] = Object.entries(event.data).flat();
        const {
          fullMessage,
          userId,
          message,
          receiverPublicKey,
          senderPublicKey,
          mode,
          theme,
          credentials,
          privateFieldFilters,
          expectedUserEncryptionPublicKey,
          walletAddress,
        } = requestData;

        const paramBuilder = {
          confirm: () => [message],
          decrypt: () => [fullMessage, senderPublicKey],
          encrypt: () => [message, receiverPublicKey],
          keys: () => [],
          reset: () => [],
          configure: () => [mode, theme, walletAddress],
          storage: () => [userId, expectedUserEncryptionPublicKey],
          filterCredentials: () => [credentials, privateFieldFilters],
          backupPasswordOrSecret: () => [],
          target: () => [],
        }[requestName];

        if (!paramBuilder) throw new Error(`Unexpected request from parent: ${requestName}`);

        const response = await this[requestName](...paramBuilder());
        event.ports[0].postMessage({ result: response });
      } catch (error) {
        console.error("catch", error);
        event.ports[0].postMessage({ error });
      } finally {
        this.unlockButton.style.display = "none";
        this.confirmButton.style.display = "none";
        event.ports[0].close();
      }
    });
  }

  async handleIDOSStore(payload) {
    return new Promise((resolve, reject) => {
      const { port1, port2 } = new MessageChannel();
      port1.onmessage = async ({ data: { error, result } }) => {
        if (error) return reject(error);

        if (result.type === "idOS:store") {
          resolve(result);
          port1.close();
        }
      };

      window.parent.postMessage({ type: "idOS:store", payload }, this.parentOrigin, [port2]);
    });
  }

  async openDialog(intent, message) {
    if (!this.userId) throw new Error("Can't open dialog without userId");
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

    const dialogURL = new URL(`/dialog.html?userId=${this.userId}`, window.location.origin);
    this.dialog = window.open(dialogURL, "idos-dialog", popupConfig);

    await new Promise((resolve) =>
      this.dialog.addEventListener("idOS-Enclave:ready", resolve, { once: true }),
    );

    return new Promise((resolve, reject) => {
      const { port1, port2 } = new MessageChannel();
      port1.onmessage = async ({ data: { error, result } }) => {
        if (error) {
          console.error(error)
          this.unlockButton.disabled = false;
          this.confirmButton.disabled = false;
          this.backupButton.disabled = false;
          port1.close();
          // this.dialog.close();
          return reject(error);
        }
        console.log({openDialogResult: result})
        if (result.type === "idOS:store" && result.status === "pending") {
          result = await this.handleIDOSStore(result.payload);

          return this.dialog.postMessage(
            {
              intent: "backupPasswordOrSecret",
              message: { status: result.status },
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
