import type { idOSCredential } from "@idos-network/credentials";
import { STORAGE_KEYS } from "@idos-network/utils/enclave";
import { LocalEnclave, type LocalEnclaveOptions } from "@idos-network/utils/enclave/local";

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
  expectedUserEncryptionPublicKey?: string;
  walletAddress?: string;
  signature?: string;
  credentials?: idOSCredential[];
  privateFieldFilters?: { pick: Record<string, unknown[]>; omit: Record<string, unknown[]> };
};

type RequestName =
  | "confirm"
  | "decrypt"
  | "encrypt"
  | "keys"
  | "reset"
  | "load"
  | "configure"
  | "storage"
  | "backupPasswordOrSecret"
  | "signTypedDataResponse"
  | "filterCredentials"
  | "target";

const ENCLAVE_AUTHORIZED_ORIGINS_KEY = "enclave-authorized-origins";

interface EnclaveOptions extends LocalEnclaveOptions {
  walletAddress: string | "";
}

export class Enclave extends LocalEnclave<EnclaveOptions> {
  // Origins
  private authorizedOrigins: string[] = [];
  private parentOrigin: string;

  // Buttons & UI
  private dialog: Window | null;
  private unlockButton: HTMLButtonElement;
  private confirmButton: HTMLButtonElement;
  private backupButton: HTMLButtonElement;

  // Signer resolver
  private signTypeDataResponseResolver: ((signature: string) => void)[] = [];

  constructor({ parentOrigin }: { parentOrigin: string }) {
    super({
      allowedAuthMethods:
        import.meta.env.VITE_ENABLE_MPC === "true" ? ["mpc", "password"] : ["password"],
      mpcConfiguration:
        import.meta.env.VITE_ENABLE_MPC === "true"
          ? {
              nodeUrl: import.meta.env.VITE_MPC_READER_NODE_URL,
              contractAddress: import.meta.env.VITE_MPC_CONTRACT_ADDRESS,
            }
          : undefined,
      walletAddress: "",
    });

    this.parentOrigin = parentOrigin;

    this.unlockButton = document.querySelector("button#unlock") as HTMLButtonElement;
    this.confirmButton = document.querySelector("button#confirm") as HTMLButtonElement;
    this.backupButton = document.querySelector("button#backup") as HTMLButtonElement;

    this.dialog = null;

    this.listenToRequests();
  }

  async load(): Promise<void> {
    await super.load();

    this.authorizedOrigins = JSON.parse(
      (await this.store.get<string>(ENCLAVE_AUTHORIZED_ORIGINS_KEY)) ?? "[]",
    );

    if (!this.isAuthorizedOrigin) {
      this.keyPair = null;

      // Reset secret key to undefined to trigger the dialog to authorize the origin
      await this.store.delete(STORAGE_KEYS.ENCRYPTION_SECRET_KEY);
    }
  }

  get isAuthorizedOrigin() {
    return this.authorizedOrigins.includes(this.parentOrigin);
  }

  async chooseAuthAndPassword(): Promise<{
    authMethod: AuthMethod;
    password?: string;
    duration?: number;
  }> {
    this.unlockButton.style.display = "block";
    this.unlockButton.disabled = false;

    return new Promise((resolve, reject) => {
      this.unlockButton.addEventListener("click", async () => {
        this.unlockButton.disabled = true;

        let authMethod: AuthMethod | undefined;
        let password: string | undefined;
        let duration: number | undefined;

        try {
          // Don't remove the empty object, it's used to trigger the dialog
          ({ authMethod, password, duration } = await this.openDialog("auth", {
            allowedAuthMethods: this.allowedAuthMethods,
            previouslyUsedAuthMethod: this.authMethod,
            expectedUserEncryptionPublicKey: this.expectedUserEncryptionPublicKey,
          }));

          if (!authMethod) {
            return reject(new Error(`Invalid or empty auth method: ${authMethod}`));
          }
        } catch (e) {
          return reject(e);
        }

        this.authorizedOrigins = [...new Set([...this.authorizedOrigins, this.parentOrigin])];
        await this.store.set(
          ENCLAVE_AUTHORIZED_ORIGINS_KEY,
          JSON.stringify(this.authorizedOrigins),
        );

        return resolve({ authMethod, password, duration });
      });
    });
  }

  async confirm(message: string): Promise<boolean> {
    this.confirmButton.style.display = "block";
    this.confirmButton.disabled = false;

    return new Promise((resolve) =>
      this.confirmButton.addEventListener("click", async () => {
        this.confirmButton.disabled = true;

        const { confirmed } = await this.openDialog("confirm", {
          message,
          origin: this.parentOrigin,
        });

        resolve(confirmed ?? false);
      }),
    );
  }

  async configure(mode: "new" | "existing", theme: "light" | "dark", walletAddress: string) {
    await this.reconfigure({
      mode,
      theme,
      walletAddress,
    });

    if (this.options.mode === "new") {
      this.unlockButton.classList.add("create");
    } else {
      this.unlockButton.classList.remove("create");
    }
  }

  // biome-ignore lint/suspicious/noExplicitAny: TODO: Change this when we know how to MPC & other chains
  async signTypedData(domain: any, types: any, value: any): Promise<string> {
    return new Promise((resolve, _reject) => {
      this.signTypeDataResponseResolver.push(resolve);

      window.parent.postMessage(
        { type: "idOS:signTypedData", payload: { domain, types, value } },
        this.parentOrigin,
      );
    });
  }

  async signTypedDataResponse(signature: string): Promise<void> {
    const resolver = this.signTypeDataResponseResolver.pop();

    if (!resolver) throw new Error("No resolver found");

    resolver(signature);
  }

  async backupPasswordOrSecret(): Promise<void> {
    this.backupButton.style.display = "block";
    this.backupButton.disabled = false;

    // We are getting the secret key from the store as a string, we don't want byte array.
    const secretKey = await this.store.get<string>(STORAGE_KEYS.ENCRYPTION_SECRET_KEY);
    const password = await this.store.get<string>(STORAGE_KEYS.PASSWORD);
    const preferredAuthMethod = await this.store.get<AuthMethod>(
      STORAGE_KEYS.PREFERRED_AUTH_METHOD,
    );

    if (!secretKey || !preferredAuthMethod) {
      throw new Error("No secrets were found for backup");
    }

    return new Promise((resolve, reject) => {
      this.backupButton.addEventListener("click", async () => {
        try {
          this.backupButton.disabled = true;

          await this.openDialog("backupPasswordOrSecret", {
            authMethod: preferredAuthMethod,
            secret: password ?? secretKey,
          });

          resolve();
        } catch (error) {
          reject(error);
        } finally {
          this.backupButton.style.display = "none";
          this.backupButton.disabled = false;
        }
      });
    });
  }

  private listenToRequests() {
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
          signature,
          credentials,
          privateFieldFilters,
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
          signTypedDataResponse: () => [signature],
          target: () => [],
          load: () => [],
          filterCredentials: () => [credentials, privateFieldFilters],
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

  private async openDialog(
    intent: string,
    // biome-ignore lint/suspicious/noExplicitAny: any is fine here.
    message?: any,
  ): Promise<{
    authMethod?: AuthMethod;
    password?: string;
    duration?: number;
    confirmed?: boolean;
  }> {
    if (!this.userId) throw new Error("Can't open dialog without userId");

    const width = 600;
    const height =
      this.options?.mode === "new" ? 600 : intent === "backupPasswordOrSecret" ? 520 : 400;
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

        port1.close();
        this.dialog?.close();

        return resolve(result);
      };

      this.dialog?.postMessage(
        { intent, message, configuration: this.options },
        this.dialog?.origin,
        [port2],
      );
    });
  }
}