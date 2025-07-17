import type { idOSCredential } from "@idos-network/core";
import { decrypt, encrypt, keyDerivation } from "@idos-network/utils/encryption";
import { LocalStorageStore, type Store } from "@idos-network/utils/store";
import * as Base64Codec from "@stablelib/base64";
import nacl from "tweetnacl";
import { Client as MPCClient } from "./mpc/client";

type AuthMethod = "mpc" | "password";

// Type definitions for request handling
type RequestData = {
  fullMessage?: Uint8Array;
  userId?: string;
  message?: string;
  receiverPublicKey?: Uint8Array;
  senderPublicKey?: Uint8Array;
  mode?: "new" | "existing";
  theme?: string;
  credentials?: idOSCredential[];
  privateFieldFilters?: {
    pick: Record<string, unknown[]>;
    omit: Record<string, unknown[]>;
  };
  expectedUserEncryptionPublicKey?: string;
  walletAddress?: string;
};

type RequestName =
  | "confirm"
  | "decrypt"
  | "encrypt"
  | "keys"
  | "reset"
  | "configure"
  | "storage"
  | "backupPasswordOrSecret"
  | "target";

export class Enclave {
  private keyPair!: nacl.BoxKeyPair;
  private mpcClient: MPCClient;
  private dialog: Window | null;
  private configuration: { mode: string; theme: string; walletAddress: string };
  private authorizedOrigins: string[] = [];
  private parentOrigin: string;
  private store: Store;
  private storeWithCodec: Store;
  private unlockButton: HTMLButtonElement;
  private confirmButton: HTMLButtonElement;
  private backupButton: HTMLButtonElement;
  private userId?: string;
  private expectedUserEncryptionPublicKey?: string;

  constructor({ parentOrigin }: { parentOrigin: string }) {
    this.parentOrigin = parentOrigin;
    this.store = new LocalStorageStore();
    this.storeWithCodec = this.store.pipeCodec<Uint8Array<ArrayBufferLike>>(Base64Codec);

    this.unlockButton = document.querySelector("button#unlock") as HTMLButtonElement;
    this.confirmButton = document.querySelector("button#confirm") as HTMLButtonElement;
    this.backupButton = document.querySelector("button#backup") as HTMLButtonElement;

    this.mpcClient = new MPCClient(
      import.meta.env.VITE_MPC_READER_NODE_URL,
      import.meta.env.VITE_MPC_CONTRACT_ADDRESS,
    );

    this.dialog = null;
    this.configuration = { mode: "", theme: "", walletAddress: "" };

    this.listenToRequests();
  }

  async initFromStore() {
    this.authorizedOrigins = JSON.parse(
      (await this.store.get<string>("enclave-authorized-origins")) ?? "[]",
    );

    const secretKey =
      await this.storeWithCodec.get<Uint8Array<ArrayBufferLike>>("encryption-private-key");
    if (secretKey) this.keyPair = nacl.box.keyPair.fromSecretKey(secretKey);
  }

  get isAuthorizedOrigin() {
    return this.authorizedOrigins.includes(this.parentOrigin);
  }

  async reset() {
    await this.store.reset();
  }

  safeParse(string: string) {
    try {
      const parsed = JSON.parse(string);
      return parsed;
    } catch (_error) {
      return string;
    }
  }

  async storage(userId: string, expectedUserEncryptionPublicKey: string) {
    // In case the user is different, we reset the store.
    if (userId !== (await this.store.get<string>("user-id"))) {
      await this.reset();
    }

    userId && (await this.store.set("user-id", userId));

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
      userId:
        this.userId ??
        (await this.store.get<string>("user-id")) ??
        (await this.store.get<string>("human-id")),
      encryptionPublicKey: await this.storeWithCodec.get<string>("encryption-public-key"),
    };
  }

  async keys() {
    let secretKey =
      await this.storeWithCodec.get<Uint8Array<ArrayBufferLike>>("encryption-private-key");

    if (!secretKey) {
      let preferredAuthMethod: AuthMethod = "password";

      if (import.meta.env.VITE_ENABLE_MPC === "true")
        preferredAuthMethod = await this.ensurePreferredAuthMethod();

      switch (preferredAuthMethod) {
        case "password": {
          if (!this.userId) {
            throw new Error("userId is not found");
          }

          const password = await this.ensurePassword();
          const salt = this.userId;
          secretKey = await keyDerivation(password, salt);
          break;
        }
        case "mpc":
          secretKey = await this.ensureMPCPrivateKey();
          break;
      }
    }

    if (!secretKey) {
      throw new Error("secretKey is not found");
    }

    await this.ensureKeyPair(secretKey);

    return this.keyPair?.publicKey;
  }

  async ensurePreferredAuthMethod(): Promise<AuthMethod> {
    const allowedAuthMethods: AuthMethod[] = ["mpc", "password"];
    let authMethod = await this.store.get<AuthMethod>("preferred-auth-method");
    let password: string | undefined;

    if (authMethod) {
      return authMethod;
    }

    this.unlockButton.style.display = "block";
    this.unlockButton.disabled = false;

    return new Promise((resolve, reject) =>
      this.unlockButton.addEventListener("click", async () => {
        this.unlockButton.disabled = true;

        try {
          // Don't remove the empty object, it's used to trigger the dialog
          ({ authMethod, password } = await this.openDialog("auth", {
            expectedUserEncryptionPublicKey: this.expectedUserEncryptionPublicKey,
          }));

          if (!authMethod || !allowedAuthMethods.includes(authMethod)) {
            return reject(new Error(`Invalid auth method: ${authMethod}`));
          }
        } catch (e) {
          return reject(e);
        }
        await this.store.set("preferred-auth-method", authMethod);
        if (password) await this.store.set("password", password);
        this.authorizedOrigins = [...new Set([...this.authorizedOrigins, this.parentOrigin])];
        await this.store.set("enclave-authorized-origins", JSON.stringify(this.authorizedOrigins));

        return authMethod ? resolve(authMethod) : reject();
      }),
    );
  }

  async ensurePassword(): Promise<string> {
    const storedPassword = await this.store.get<string>("password");

    if (this.isAuthorizedOrigin && storedPassword) return Promise.resolve(storedPassword);

    this.unlockButton.style.display = "block";
    this.unlockButton.disabled = false;
    let password: string | undefined;
    // let duration: number | undefined;

    return new Promise((resolve, reject) =>
      this.unlockButton.addEventListener("click", async () => {
        this.unlockButton.disabled = true;

        try {
          // TODO: Add duration
          ({ password } = await this.openDialog("password", {
            expectedUserEncryptionPublicKey: this.expectedUserEncryptionPublicKey,
          }));
        } catch (e) {
          return reject(e);
        }

        await this.store.set("password", password);

        this.authorizedOrigins = [...new Set([...this.authorizedOrigins, this.parentOrigin])];
        await this.store.set("enclave-authorized-origins", JSON.stringify(this.authorizedOrigins));

        return password ? resolve(password) : reject();
      }),
    );
  }

  async ensureKeyPair(secretKey: Uint8Array<ArrayBufferLike>) {
    this.keyPair = nacl.box.keyPair.fromSecretKey(secretKey);

    await this.storeWithCodec.set("encryption-private-key", this.keyPair.secretKey);
    await this.storeWithCodec.set("encryption-public-key", this.keyPair.publicKey);
  }

  async ensureMPCPrivateKey() {
    if (this.configuration?.mode !== "new") {
      const { status: downloadStatus, secret: downloadedSecret } = await this.downloadSecret();
      if (downloadStatus !== "ok") {
        throw Error("A secret might be stored at ZK nodes, but can't be obtained");
      }

      return downloadedSecret;
    }

    const privateKey = nacl.box.keyPair().secretKey;
    const { status: uploadStatus } = await this.uploadSecret(privateKey);

    if (uploadStatus !== "success") {
      throw Error(`A secret upload failed with status: ${uploadStatus}`);
    }

    return privateKey;
  }

  async downloadSecret(): Promise<{ status: string; secret: Buffer | undefined }> {
    return new Promise((resolve, reject) => {
      const ephemeralKeyPair = nacl.box.keyPair();
      const signerAddress = this.configuration.walletAddress;
      const downloadRequest = this.mpcClient.downloadRequest(
        signerAddress,
        ephemeralKeyPair.publicKey,
      );
      const messageToSign = this.mpcClient.downloadMessageToSign(downloadRequest);

      const channel = new MessageChannel();
      channel.port1.onmessage = async (message) => {
        channel.port1.close();

        if (!this.userId) {
          console.error("userId is not found");
          reject(new Error("userId is not found"));
          return;
        }

        const { status, secret } = await this.mpcClient.downloadSecret(
          this.userId,
          downloadRequest,
          message.data.data,
          ephemeralKeyPair.secretKey,
        );

        return resolve({ status, secret });
      };

      const signMessage = {
        type: "idOS-MPC:signMessage",
        payload: messageToSign,
      };

      window.parent.postMessage(signMessage, this.parentOrigin, [channel.port2]);
    });
  }

  async uploadSecret(secret: Uint8Array<ArrayBufferLike>): Promise<{ status: string }> {
    return new Promise((resolve, reject) => {
      const signerAddress = this.configuration.walletAddress;
      if (!signerAddress) {
        console.error("signerAddress is not found");
        return resolve({ status: "no-signer-address" });
      }

      const blindedShares = this.mpcClient.getBlindedShares(Buffer.from(secret));
      const uploadRequest = this.mpcClient.uploadRequest(blindedShares, signerAddress);
      const messageToSign = this.mpcClient.uploadMessageToSign(uploadRequest);

      const channel = new MessageChannel();
      channel.port1.onmessage = async (message) => {
        channel.port1.close();

        if (!this.userId) {
          console.error("userId is not found");
          reject(new Error("userId is not found"));
          return;
        }

        const { status } = await this.mpcClient.uploadSecret(
          this.userId,
          uploadRequest,
          message.data.data,
          blindedShares,
        );

        return resolve({ status });
      };

      const signMessage = {
        type: "idOS-MPC:signMessage",
        payload: messageToSign,
      };

      window.parent.postMessage(signMessage, this.parentOrigin, [channel.port2]);
    });
  }

  encrypt(message: Uint8Array, receiverPublicKey = this.keyPair.publicKey) {
    return encrypt(message, this.keyPair.publicKey, receiverPublicKey);
  }

  async decrypt(fullMessage: Uint8Array<ArrayBufferLike>, senderPublicKey: Uint8Array) {
    if (!this.keyPair) await this.keys();

    return decrypt(fullMessage, this.keyPair, senderPublicKey);
  }

  async confirm(message: string) {
    this.confirmButton.style.display = "block";
    this.confirmButton.disabled = false;

    return new Promise((resolve) =>
      this.confirmButton.addEventListener("click", async () => {
        this.confirmButton.disabled = true;

        const { confirmed } = await this.openDialog("confirm", {
          message,
          origin: this.parentOrigin,
        });

        resolve(confirmed);
      }),
    );
  }

  async configure(mode: "new" | "existing", theme: string, walletAddress: string) {
    this.configuration = { mode, theme, walletAddress };

    if (mode === "new") {
      this.unlockButton.classList.add("create");
    } else {
      this.unlockButton.classList.remove("create");
    }
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
          resolve(true);
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
        const entries = Object.entries(event.data);
        const [requestName, requestData] = entries.flat() as [RequestName, RequestData];

        const {
          fullMessage,
          userId,
          message,
          receiverPublicKey,
          senderPublicKey,
          mode,
          theme,
          expectedUserEncryptionPublicKey,
          walletAddress,
        } = requestData;

        const paramBuilder: Record<RequestName, () => unknown[]> = {
          confirm: () => [message],
          decrypt: () => [fullMessage, senderPublicKey],
          encrypt: () => [message, receiverPublicKey],
          keys: () => [],
          reset: () => [],
          configure: () => [mode, theme, walletAddress],
          storage: () => [userId, expectedUserEncryptionPublicKey],
          backupPasswordOrSecret: () => [],
          target: () => [],
        };

        const paramBuilderFn = paramBuilder[requestName];
        if (!paramBuilderFn) throw new Error(`Unexpected request from parent: ${requestName}`);

        // Type assertion for method call
        const method = this[requestName as keyof this] as (...args: unknown[]) => Promise<unknown>;
        const response = await method.bind(this)(...paramBuilderFn());
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

  // biome-ignore lint/suspicious/noExplicitAny: any is fine here.
  async handleIDOSStore(payload: any) {
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

  async openDialog(
    intent: string,
    // biome-ignore lint/suspicious/noExplicitAny: any is fine here.
    message?: any,
  ): Promise<{ authMethod?: AuthMethod; password?: string; confirmed?: boolean }> {
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
      this.dialog?.addEventListener("idOS-Enclave:ready", resolve, { once: true }),
    );

    return new Promise((resolve, reject) => {
      const { port1, port2 } = new MessageChannel();
      port1.onmessage = async ({ data: { error, result } }) => {
        if (error) {
          console.error(error);
          this.unlockButton.disabled = false;
          this.confirmButton.disabled = false;
          this.backupButton.disabled = false;
          port1.close();
          // this.dialog.close();
          return reject(error);
        }
        if (result.type === "idOS:store" && result.status === "pending") {
          result = await this.handleIDOSStore(result.payload);

          return this.dialog?.postMessage(
            {
              intent: "backupPasswordOrSecret",
              message: { status: result.status },
              configuration: this.configuration,
            },
            this.dialog.origin,
          );
        }

        port1.close();
        this.dialog?.close();

        return resolve(result);
      };

      this.dialog?.postMessage(
        { intent, message, configuration: this.configuration },
        this.dialog?.origin,
        [port2],
      );
    });
  }
}
