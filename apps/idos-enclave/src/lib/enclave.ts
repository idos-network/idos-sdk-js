import { LocalEnclave } from "@idos-network/utils/enclave";

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

export class Enclave extends LocalEnclave {
  private configuration: { mode: string; theme: string; walletAddress: string };

  // Origins
  private authorizedOrigins: string[] = [];
  private parentOrigin: string;

  // Buttons & UI
  private dialog: Window | null;
  private unlockButton: HTMLButtonElement;
  private confirmButton: HTMLButtonElement;
  private backupButton: HTMLButtonElement;

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
    });

    this.parentOrigin = parentOrigin;

    this.unlockButton = document.querySelector("button#unlock") as HTMLButtonElement;
    this.confirmButton = document.querySelector("button#confirm") as HTMLButtonElement;
    this.backupButton = document.querySelector("button#backup") as HTMLButtonElement;

    this.dialog = null;
    this.configuration = { mode: "", theme: "", walletAddress: "" };

    this.listenToRequests();
  }

  async load(): Promise<void> {
    await super.load();

    this.authorizedOrigins = JSON.parse(
      (await this.store.get<string>("enclave-authorized-origins")) ?? "[]",
    );
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
        await this.store.set("enclave-authorized-origins", JSON.stringify(this.authorizedOrigins));

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

  async configure(mode: "new" | "existing", theme: string, walletAddress: string) {
    this.configuration = { mode, theme, walletAddress };

    if (mode === "new") {
      this.unlockButton.classList.add("create");
    } else {
      this.unlockButton.classList.remove("create");
    }
  }

  // Override signer method to ask the iframe provider
  async signTypedData(domain: any, types: any, value: any): Promise<string> {
    return new Promise((resolve, _reject) => {
      window.addEventListener("message", (event) => {
        if (event.data.type === "idOS:signTypedDataResponse") {
          resolve(event.data.payload);
        }
      });

      window.parent.postMessage(
        { type: "idOS:signTypedData", payload: { domain, types, value } },
        this.parentOrigin,
      );
    });
  }

  async backupPasswordOrSecret(): Promise<void> {
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
  private async handleIDOSStore(payload: any) {
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
