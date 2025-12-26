import type {
  EncryptionPasswordStore,
  MPCPasswordContext,
  PasswordContext,
} from "@idos-network/utils/enclave";
import { LocalEnclave, type LocalEnclaveOptions } from "@idos-network/utils/enclave/local";

const ENCLAVE_AUTHORIZED_ORIGINS_KEY = "enclave-authorized-origins";

/**
 * Safely parses JSON string with fallback value
 * @param json - JSON string to parse
 * @param fallback - Fallback value if parsing fails
 * @returns Parsed value or fallback
 */
function safeParse<T>(json: string | null | undefined, fallback: T): T {
  try {
    return json ? JSON.parse(json) : fallback;
  } catch {
    return fallback;
  }
}

export class Enclave extends LocalEnclave<LocalEnclaveOptions> {
  // Origins
  private authorizedOrigins: string[] = [];
  private parentOrigin: string;

  // Buttons & UI
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

    const unlockButton = document.querySelector<HTMLButtonElement>("button#unlock");
    const confirmButton = document.querySelector<HTMLButtonElement>("button#confirm");
    const backupButton = document.querySelector<HTMLButtonElement>("button#backup");

    if (!unlockButton || !confirmButton || !backupButton) {
      throw new Error(
        "Enclave buttons not found. Ensure HTML contains #unlock, #confirm, and #backup buttons.",
      );
    }

    this.unlockButton = unlockButton;
    this.confirmButton = confirmButton;
    this.backupButton = backupButton;

    this.listenToRequests();
  }

  /** @see LocalEnclave#load */
  async load(): Promise<void> {
    await super.load();

    this.authorizedOrigins = safeParse(
      await this.store.get<string>(ENCLAVE_AUTHORIZED_ORIGINS_KEY),
      [],
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
          // We are skipping the dialog for MPC
          // so the line below is skipped, and the user will be asked
          // to asked during encryption again... so we should accept origin.
          await this.acceptParentOrigin();
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

  async reconfigure(options: Partial<LocalEnclaveOptions> = {}) {
    await super.reconfigure(options);

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
      if (event.origin !== this.parentOrigin || event.ports.length === 0) {
        return;
      }

      try {
        const { method, data } = event.data;

        // Whitelisted methods
        const allowedMethods: (keyof this)[] = [
          "load",
          "reconfigure",
          "confirm",
          "decrypt",
          "encrypt",
          "reset",
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
    // biome-ignore lint/suspicious/noExplicitAny: any is fine here.
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
    const dialog = window.open(dialogURL, "idos-dialog", popupConfig);

    if (!dialog) {
      throw new Error("Failed to open dialog. Popup may be blocked by browser.");
    }

    await new Promise((resolve) =>
      dialog.addEventListener("idOS-Enclave:ready", resolve, { once: true }),
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
          dialog.close();
          return reject(error);
        }

        port1.close();
        dialog.close();

        return resolve(result);
      };

      dialog.postMessage({ intent, message, configuration: this.options }, dialog.origin, [port2]);
    });
  }
}
