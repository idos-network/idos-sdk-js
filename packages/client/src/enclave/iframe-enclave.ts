import { BaseProvider, type EnclaveOptions, type StoredData } from "@idos-network/utils/enclave";

export interface IframeEnclaveOptions extends EnclaveOptions {
  container: string;
  url?: string;
  throwOnUserCancelUnlock?: boolean;
}

export class IframeEnclave extends BaseProvider<IframeEnclaveOptions> {
  private container: string;
  private iframe: HTMLIFrameElement;
  private hostUrl: URL;

  constructor(options: IframeEnclaveOptions) {
    super(options);

    if (!this.options.container) {
      throw new Error("container is required");
    }

    this.container = this.options.container;
    this.hostUrl = new URL(this.options.url ?? "https://enclave.idos.network");
    this.iframe = document.createElement("iframe");
    this.iframe.id = "idos-enclave-iframe";
  }

  async load(): Promise<void> {
    // Don't call super.load() here, because we want to load the enclave first.
    await this.loadEnclave();
    await this.reconfigure();
    await this.bindMessageListener();
  }

  async reset(): Promise<void> {
    this.requestToEnclave({ reset: {} });
  }

  async reconfigure(options: Omit<IframeEnclaveOptions, "container" | "url"> = {}): Promise<void> {
    super.reconfigure(options);
    await this.requestToEnclave({ configure: this.options });
  }

  async confirm(message: string): Promise<boolean> {
    this.showEnclave();

    return this.requestToEnclave({ confirm: { message } }).then((response) => {
      this.hideEnclave();
      return response as boolean;
    });
  }

  async storage(userId: string, expectedUserEncryptionPublicKey?: string): Promise<StoredData> {
    return this.requestToEnclave({
      storage: {
        userId,
        expectedUserEncryptionPublicKey,
      },
    });
  }

  async keys(): Promise<Uint8Array | undefined> {
    this.showEnclave();

    try {
      return await this.requestToEnclave({
        keys: {},
      });
    } catch (e) {
      if (this.options.throwOnUserCancelUnlock) throw e;
      return undefined;
    } finally {
      this.hideEnclave();
    }
  }

  async encrypt(
    message: Uint8Array,
    receiverPublicKey: Uint8Array,
  ): Promise<{ content: Uint8Array; encryptorPublicKey: Uint8Array }> {
    return this.requestToEnclave({
      encrypt: { message, receiverPublicKey },
    });
  }

  async decrypt(
    message: Uint8Array,
    senderPublicKey: Uint8Array,
  ): Promise<Uint8Array<ArrayBufferLike>> {
    return this.requestToEnclave({
      decrypt: { fullMessage: message, senderPublicKey },
    });
  }

  private async loadEnclave(): Promise<void> {
    const container =
      document.querySelector(this.container) ||
      throwNewError(Error, `Can't find container with selector ${this.container}`);

    // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Permissions-Policy#directives
    const permissionsPolicies = ["publickey-credentials-get", "storage-access"];

    // https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe#sandbox
    const liftedSandboxRestrictions = [
      "forms",
      "modals",
      "popups",
      "popups-to-escape-sandbox",
      "same-origin",
      "scripts",
    ].map((toLift) => `allow-${toLift}`);

    // https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe#referrerpolicy
    const referrerPolicy = "origin";

    const styles = {
      "aspect-ratio": "4/1",
      "background-color": "transparent",
      border: "none",
      display: "block",
      width: "100%",
    };

    this.iframe.allow = permissionsPolicies.join("; ");
    this.iframe.referrerPolicy = referrerPolicy;
    this.iframe.sandbox.add(...liftedSandboxRestrictions);
    this.iframe.src = this.hostUrl.toString();
    for (const [k, v] of Object.entries(styles)) {
      this.iframe.style.setProperty(k, v);
    }

    let el: HTMLElement | null;
    // biome-ignore lint/suspicious/noAssignInExpressions: it's on purpose
    while ((el = document.getElementById(this.iframe.id))) {
      console.log("reinstalling idOS iframe...");
      container.removeChild(el);
    }
    container.appendChild(this.iframe);

    return new Promise((resolve) =>
      this.iframe.addEventListener(
        "load",
        () => {
          resolve();
        },
        { once: true },
      ),
    );
  }

  private showEnclave(): void {
    // biome-ignore lint/style/noNonNullAssertion: Make the explosion visible.
    this.iframe.parentElement!.classList.add("visible");
  }

  private hideEnclave(): void {
    // biome-ignore lint/style/noNonNullAssertion: Make the explosion visible.
    this.iframe.parentElement!.classList.remove("visible");
  }

  // biome-ignore lint/suspicious/noExplicitAny: `any` is fine here. We will type it properly later.
  private async requestToEnclave(request: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const { port1, port2 } = new MessageChannel();

      port1.onmessage = ({ data }) => {
        port1.close();
        data.error ? reject(data.error) : resolve(data.result);
      };

      // biome-ignore lint/style/noNonNullAssertion: Make the explosion visible.
      this.iframe.contentWindow!.postMessage(request, this.hostUrl.origin, [port2]);
    });
  }

  private bindMessageListener(): void {
    window.addEventListener("message", this.onMessage.bind(this));
  }

  private async onMessage(message: MessageEvent): Promise<void> {
    if (message.data.type !== "idOS:signTypedData" || message.origin !== this.hostUrl.origin)
      return;

    const payload = message.data.payload;
    const signature = await this.signTypedData(payload.domain, payload.types, payload.value);

    await this.requestToEnclave({
      signTypedDataResponse: {
        signature,
      },
    });
  }

  async backupPasswordOrSecret(): Promise<void> {
    this.showEnclave();

    try {
      await this.requestToEnclave({
        backupPasswordOrSecret: {},
      });
    } catch (error) {
      console.error(error);
    } finally {
      this.hideEnclave();
    }
  }
}

function throwNewError(ErrorClass: ErrorConstructor, ...args: Parameters<ErrorConstructor>): never {
  throw new ErrorClass(...args);
}
