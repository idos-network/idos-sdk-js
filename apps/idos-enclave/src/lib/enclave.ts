import type { idOSCredential } from "@idos-network/credentials";
import type {
  EncryptionPasswordStore,
  MPCPasswordContext,
  PasswordContext,
} from "@idos-network/utils/enclave";
import { LocalEnclave, type LocalEnclaveOptions } from "@idos-network/utils/enclave/local";

// Type definitions for request handling
type RequestData = {
  fullMessage?: Uint8Array;
  userId?: string;
  message?: string;
  receiverPublicKey?: Uint8Array;
  senderPublicKey?: Uint8Array;
  mode?: "new" | "existing";
  theme?: string;
  encryptionPasswordStore?: EncryptionPasswordStore;
  expectedUserEncryptionPublicKey?: string;
  walletAddress?: string;
  signature?: string;
  credentials?: idOSCredential[];
  privateFieldFilters?: { pick: Record<string, unknown[]>; omit: Record<string, unknown[]> };
};

export type RequestName =
  | "confirm"
  | "decrypt"
  | "encrypt"
  | "ensureUserEncryptionProfile"
  | "reset"
  | "load"
  | "configure"
  | "backupUserEncryptionProfile"
  | "signTypedDataResponse"
  | "filterCredentials";

const ENCLAVE_AUTHORIZED_ORIGINS_KEY = "enclave-authorized-origins";

export class Enclave extends LocalEnclave<LocalEnclaveOptions> {
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
      allowedEncryptionStores:
        import.meta.env.VITE_ENABLE_MPC === "true" ? ["mpc", "user"] : ["user"],
      mpcConfiguration:
        import.meta.env.VITE_ENABLE_MPC === "true"
          ? {
              nodeUrl: import.meta.env.VITE_MPC_READER_NODE_URL,
              contractAddress: import.meta.env.VITE_MPC_CONTRACT_ADDRESS,
            }
          : undefined,
    });

    this.parentOrigin = parentOrigin;

    this.unlockButton = document.querySelector("button#unlock") as HTMLButtonElement;
    this.confirmButton = document.querySelector("button#confirm") as HTMLButtonElement;
    this.backupButton = document.querySelector("button#backup") as HTMLButtonElement;

    this.dialog = null;

    this.listenToRequests();
  }

  /** @see LocalEnclave#load */
  async load(): Promise<void> {
    await super.load();

    this.authorizedOrigins = JSON.parse(
      (await this.store.get<string>(ENCLAVE_AUTHORIZED_ORIGINS_KEY)) ?? "[]",
    );
  }

  /** @see LocalEnclave#reset */
  async reset(): Promise<void> {
    await super.reset();

    this.authorizedOrigins = [];
  }

  /** @see LocalEnclave#guardKeys */
  async guardKeys(): Promise<boolean> {
    if (this.authorizedOrigins.includes(this.parentOrigin)) {
      return true;
    }

    const confirmation = await this.confirm(
      `Do you want to authorize '${this.parentOrigin}' to use the keys?`,
    );

    if (!confirmation) {
      return false;
    }

    await this.acceptParentOrigin();

    return true;
  }

  /** @see LocalEnclave#getPasswordContext */
  async getPasswordContext(): Promise<PasswordContext | MPCPasswordContext> {
    this.unlockButton.style.display = "block";
    this.unlockButton.disabled = false;

    return new Promise((resolve, reject) => {
      this.unlockButton.addEventListener("click", async () => {
        this.unlockButton.disabled = true;

        if (this.options.encryptionPasswordStore === "mpc") {
          return resolve({ encryptionPasswordStore: this.options.encryptionPasswordStore });
        }

        let encryptionPasswordStore: EncryptionPasswordStore | undefined;
        let password: string | undefined;
        let duration: number | undefined;

        try {
          // Don't remove the empty object, it's used to trigger the dialog
          ({ encryptionPasswordStore, password, duration } = await this.openDialog(
            "getPasswordContext",
            {
              allowedEncryptionStores: this.allowedEncryptionStores,
              encryptionPasswordStore: this.options.encryptionPasswordStore,
              expectedUserEncryptionPublicKey: this.options.expectedUserEncryptionPublicKey,
            },
          ));

          if (!encryptionPasswordStore) {
            return reject(new Error(`Invalid or empty auth method: ${encryptionPasswordStore}`));
          }
        } catch (e) {
          return reject(e);
        }

        // User providing the password also means that they want to authorize the origin
        await this.acceptParentOrigin();

        if (encryptionPasswordStore === "mpc") {
          return resolve({ encryptionPasswordStore });
        }

        // biome-ignore lint/style/noNonNullAssertion: This needs to be properly typed.
        return resolve({ encryptionPasswordStore, password: password!, duration });
      });
    });
  }

  /** @see LocalEnclave#confirm */
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

  async configure(
    mode: "new" | "existing",
    theme: "light" | "dark",
    walletAddress: string,
    userId: string,
    encryptionPasswordStore: EncryptionPasswordStore,
    expectedUserEncryptionPublicKey: string,
  ) {
    await this.reconfigure({
      mode,
      theme,
      walletAddress,
      userId,
      encryptionPasswordStore,
      expectedUserEncryptionPublicKey,
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

  /** @see LocalEnclave#backupUserEncryptionProfile */
  async backupUserEncryptionProfile(): Promise<void> {
    this.backupButton.style.display = "block";
    this.backupButton.disabled = false;

    return new Promise((resolve, reject) => {
      this.backupButton.addEventListener("click", async () => {
        try {
          this.backupButton.disabled = true;

          // We need to get the private profile to get the password
          // also we want to skip the guard check for now, because
          // the page actually won't be able to use the keys.
          const profile = await this.getPrivateEncryptionProfile(true);

          if (!profile) {
            throw new Error("No secrets were found for backup");
          }

          await this.openDialog("backupPasswordContext", {
            password: profile.password,
            encryptionPasswordStore: profile.encryptionPasswordStore,
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

  /**
   * Accepts the parent origin and stores it in the authorized origins.
   * So next time enclave won't ask for permission again.
   */
  private async acceptParentOrigin(): Promise<void> {
    this.authorizedOrigins = [...new Set([...this.authorizedOrigins, this.parentOrigin])];

    await this.store.set(ENCLAVE_AUTHORIZED_ORIGINS_KEY, JSON.stringify(this.authorizedOrigins));
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
          message,
          receiverPublicKey,
          senderPublicKey,
          mode,
          theme,
          walletAddress,
          signature,
          credentials,
          privateFieldFilters,
          userId,
          encryptionPasswordStore,
          expectedUserEncryptionPublicKey,
        } = requestData;

        const paramBuilder: Record<RequestName, () => unknown[]> = {
          load: () => [],
          confirm: () => [message],
          decrypt: () => [fullMessage, senderPublicKey],
          encrypt: () => [message, receiverPublicKey],
          reset: () => [],
          configure: () => [
            mode,
            theme,
            walletAddress,
            userId,
            encryptionPasswordStore,
            expectedUserEncryptionPublicKey,
          ],
          ensureUserEncryptionProfile: () => [],
          signTypedDataResponse: () => [signature],
          backupUserEncryptionProfile: () => [],
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
    encryptionPasswordStore?: EncryptionPasswordStore;
    password?: string;
    duration?: number;
    confirmed?: boolean;
  }> {
    const width = 600;
    const height =
      this.options?.mode === "new" ? 600 : intent === "backupUserEncryptionProfile" ? 520 : 400;
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
