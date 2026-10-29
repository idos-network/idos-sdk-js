import type {
  EncryptionPasswordStore,
  MPCPasswordContext,
  PasswordContext,
} from "@idos-network/enclave";

import { LocalEnclave, type LocalEnclaveOptions } from "@idos-network/enclave/local";

// v2: before #1521, unlocking alone wrote to "enclave-authorized-origins", so it is no longer read.
const ENCLAVE_AUTHORIZED_ORIGINS_KEY = "enclave-authorized-origins-v2";

// Same as the longest remember duration. MPC sessions never expire, so grants need their own limit.
const ORIGIN_AUTHORIZATION_DAYS = 30;

/** Origin -> authorization expiry, in milliseconds since epoch. */
type AuthorizedOrigins = Record<string, number>;

export class Enclave extends LocalEnclave<LocalEnclaveOptions> {
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
              numMalicious: import.meta.env.VITE_MPC_NUM_MALICIOUS || 2,
              numNodes: import.meta.env.VITE_MPC_NUM_NODES || 5,
              numToReconstruct: import.meta.env.VITE_MPC_NUM_TO_RECONSTRUCT || 3,
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

  // Read from shared storage on every check, so another enclave's reset revokes it here too.
  private async authorizedOrigins(): Promise<AuthorizedOrigins> {
    const origins: AuthorizedOrigins = JSON.parse(
      (await this.store.get<string>(ENCLAVE_AUTHORIZED_ORIGINS_KEY)) ?? "{}",
    );
    return Object.fromEntries(
      Object.entries(origins).filter(([, expiresAt]) => expiresAt > Date.now()),
    );
  }

  /** @see LocalEnclave#onStoredProfileReplaced */
  protected async onStoredProfileReplaced(): Promise<void> {
    await this.store.delete(ENCLAVE_AUTHORIZED_ORIGINS_KEY);
  }

  /** @see LocalEnclave#guardKeys */
  async guardKeys(): Promise<boolean> {
    if (Object.hasOwn(await this.authorizedOrigins(), this.parentOrigin)) {
      return true;
    }

    const confirmation = await this.confirm(
      `Do you want to authorize '${this.parentOrigin}' to use the keys? ` +
        `This is remembered on this device for up to ${ORIGIN_AUTHORIZATION_DAYS} days.`,
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

        try {
          if (this.options.encryptionPasswordStore === "mpc") {
            return resolve({ encryptionPasswordStore: this.options.encryptionPasswordStore });
          }

          let encryptionPasswordStore: EncryptionPasswordStore | undefined;
          let password: string | undefined;
          let duration: number | undefined;

          // Don't remove the empty object, it's used to trigger the dialog
          ({ encryptionPasswordStore, password, duration } = await this.openDialog(
            "getPasswordContext",
            {
              allowedEncryptionStores: this.allowedEncryptionStores,
              encryptionPasswordStore: this.options.encryptionPasswordStore,
              expectedUserEncryptionPublicKey: this.options.expectedUserEncryptionPublicKey,
            },
          ));

          if (encryptionPasswordStore === "mpc") {
            return resolve({ encryptionPasswordStore });
          }

          if (!encryptionPasswordStore || encryptionPasswordStore === "mm") {
            throw new Error(`Invalid or empty auth method: ${encryptionPasswordStore}`);
          }

          // oxlint-disable-next-line typescript/no-non-null-assertion -- This needs to be properly typed.
          return resolve({ encryptionPasswordStore, password: password!, duration });
        } catch (error) {
          return reject(error);
        }
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

  async reconfigure(options: Partial<LocalEnclaveOptions> = {}) {
    await super.reconfigure(options);

    if (this.options.mode === "new") {
      this.unlockButton.classList.add("create");
    } else {
      this.unlockButton.classList.remove("create");
    }
  }

  // oxlint-disable-next-line typescript/no-explicit-any -- TODO: Change this when we know how to MPC & other chains
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
   * So enclave won't ask for permission again until the authorization expires.
   */
  private async acceptParentOrigin(): Promise<void> {
    const origins: AuthorizedOrigins = {
      ...(await this.authorizedOrigins()),
      [this.parentOrigin]: Date.now() + ORIGIN_AUTHORIZATION_DAYS * 24 * 60 * 60 * 1000,
    };

    await this.store.set(ENCLAVE_AUTHORIZED_ORIGINS_KEY, JSON.stringify(origins));
  }

  private listenToRequests() {
    window.addEventListener("message", async (event) => {
      if (event.origin !== this.parentOrigin || event.ports.length === 0) {
        return;
      }

      try {
        const { method, data } = event.data;

        // Whitelisted methods. `reset` is omitted: it deletes every idOS-* key
        // with no origin check. In-iframe user switches still call reset() directly.
        const allowedMethods: (keyof this)[] = [
          "load",
          "reconfigure",
          "confirm",
          "decrypt",
          "encrypt",
          "ensureUserEncryptionProfile",
          "signTypedDataResponse",
          "backupUserEncryptionProfile",
          "filterCredentials",
          "addAddressMessageToSign",
          "removeAddressMessageToSign",
          "addAddressToMpcSecret",
          "removeAddressFromMpcSecret",
        ];

        if (!allowedMethods.includes(method)) {
          console.error(`Unexpected request from parent: ${method}`);
          event.ports[0].postMessage({ error: `Unexpected request: ${method}` });
          event.ports[0].close();
          return;
        }

        // Type assertion for method call
        const methodFn = this[method as keyof this] as (...args: unknown[]) => Promise<unknown>;
        const response = await methodFn.bind(this)(...data);
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
    // oxlint-disable-next-line typescript/no-explicit-any -- any is fine here.
    message?: any,
  ): Promise<{
    encryptionPasswordStore?: EncryptionPasswordStore;
    password?: string;
    duration?: number;
    confirmed?: boolean;
  }> {
    const width = 360;
    const height =
      this.options?.mode === "new" ? 480 : intent === "backupUserEncryptionProfile" ? 520 : 450;
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
          this.dialog?.close();
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
