import type { MPCPasswordContext, PasswordContext } from "@idos-network/enclave";

import { LocalEnclave, type LocalEnclaveOptions } from "@idos-network/enclave/local";

import type { AllowedIntent, idOSEnclaveConfiguration } from "@/types";

const ENCLAVE_AUTHORIZED_ORIGINS_KEY = "enclave-authorized-origins";

// oxlint-disable-next-line typescript/no-explicit-any -- Intent messages vary per intent type.
export type IntentHandler = (
  intent: AllowedIntent,
  message: Record<string, any>,
  configuration: idOSEnclaveConfiguration,
) => Promise<any>;

export class Enclave extends LocalEnclave<LocalEnclaveOptions> {
  private authorizedOrigins: string[] = [];
  readonly parentOrigin: string;
  private intentHandler: IntentHandler | null = null;

  private signTypeDataResponseResolver: {
    resolve: (signature: string) => void;
    reject: (error: Error) => void;
  }[] = [];

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

    this.listenToRequests();
  }

  setIntentHandler(handler: IntentHandler): void {
    this.intentHandler = handler;
  }

  private async requestUI(
    intent: AllowedIntent,
    // oxlint-disable-next-line typescript/no-explicit-any -- Intent messages vary per intent type.
    message: Record<string, any>,
  ): Promise<any> {
    if (!this.intentHandler) throw new Error("No intent handler registered");
    return this.intentHandler(intent, message, this.options);
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
    if (this.options.encryptionPasswordStore === "mpc") {
      await this.acceptParentOrigin();
      return { encryptionPasswordStore: this.options.encryptionPasswordStore };
    }

    const { encryptionPasswordStore, password, duration } = await this.requestUI(
      "getPasswordContext",
      {
        allowedEncryptionStores: this.allowedEncryptionStores,
        encryptionPasswordStore: this.options.encryptionPasswordStore,
        expectedUserEncryptionPublicKey: this.options.expectedUserEncryptionPublicKey,
      },
    );

    if (!encryptionPasswordStore) {
      throw new Error(`Invalid or empty auth method: ${encryptionPasswordStore}`);
    }

    await this.acceptParentOrigin();

    // oxlint-disable-next-line typescript/no-non-null-assertion -- password is defined when encryptionPasswordStore is "user".
    return { encryptionPasswordStore, password: password!, duration };
  }

  /** @see LocalEnclave#confirm */
  async confirm(message: string): Promise<boolean> {
    const { confirmed } = await this.requestUI("confirm", {
      message,
      origin: this.parentOrigin,
    });

    return confirmed ?? false;
  }

  async reconfigure(options: Partial<LocalEnclaveOptions> = {}) {
    await super.reconfigure(options);
  }

  // oxlint-disable-next-line typescript/no-explicit-any -- TODO: Change this when we know how to MPC & other chains
  async signTypedData(domain: any, types: any, value: any): Promise<string> {
    window.parent.postMessage({ type: "idOS:enclaveHide" }, this.parentOrigin);

    return new Promise((resolve, reject) => {
      this.signTypeDataResponseResolver.push({ resolve, reject });

      window.parent.postMessage(
        { type: "idOS:signTypedData", payload: { domain, types, value } },
        this.parentOrigin,
      );
    });
  }

  async signTypedDataResponse(signature: string): Promise<void> {
    this.requestUI("pending", { message: "Processing..." }).catch(() => {});
    window.parent.postMessage({ type: "idOS:enclaveShow" }, this.parentOrigin);

    const resolver = this.signTypeDataResponseResolver.pop();
    if (!resolver) throw new Error("No resolver found");
    resolver.resolve(signature);
  }

  async signTypedDataError(error: string): Promise<void> {
    const resolver = this.signTypeDataResponseResolver.pop();
    if (!resolver) throw new Error("No resolver found");
    resolver.reject(new Error(error));
  }

  /** @see LocalEnclave#backupUserEncryptionProfile */
  async backupUserEncryptionProfile(): Promise<void> {
    const profile = await this.getPrivateEncryptionProfile(true);

    if (!profile) {
      throw new Error("No secrets were found for backup");
    }

    await this.requestUI("backupPasswordContext", {
      password: profile.password,
      encryptionPasswordStore: profile.encryptionPasswordStore,
    });
  }

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

        const allowedMethods: (keyof this)[] = [
          "load",
          "reconfigure",
          "confirm",
          "decrypt",
          "encrypt",
          "reset",
          "ensureUserEncryptionProfile",
          "signTypedDataResponse",
          "signTypedDataError",
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

        const methodFn = this[method as keyof this] as (...args: unknown[]) => Promise<unknown>;
        const response = await methodFn.bind(this)(...data);
        event.ports[0].postMessage({ result: response });
      } catch (error) {
        console.error("catch", error);
        event.ports[0].postMessage({ error });
      } finally {
        event.ports[0].close();
      }
    });
  }
}
