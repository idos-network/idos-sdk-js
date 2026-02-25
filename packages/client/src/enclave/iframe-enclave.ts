import type { idOSCredential } from "@idos-network/credentials/types";
import {
  BaseProvider,
  type EnclaveOptions,
  type PublicEncryptionProfile,
} from "@idos-network/enclave";
import type {
  AddAddressMessageToSign,
  AddAddressSignatureMessage,
  RemoveAddressMessageToSign,
  RemoveAddressSignatureMessage,
} from "@idos-network/enclave/mpc";
import type { BaseProviderMethodArgs, BaseProviderMethodReturn } from "./helpers";

export interface IframeEnclaveOptions extends EnclaveOptions {
  container: string;
  url?: string;
  throwOnUserCancelUnlock?: boolean;
}

export class IframeEnclave extends BaseProvider<IframeEnclaveOptions> {
  private container: string;
  private iframe: HTMLIFrameElement;
  private hostUrl: URL;
  private bound = false;

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

  /** @see parent method */
  async load(): Promise<void> {
    // First we have to create and load the iframe
    await this.createAndLoadIframe();

    // Load the enclave from the store (trigger load() method in the iframe)
    await this.requestToEnclave("load");

    // Pass current options
    await this.reconfigure();

    // Bind the message listener to the iframe (in case iframe -> enclave comm)
    await this.bindMessageListener();
  }

  /** @override parent method to call iframe */
  async reset(): Promise<void> {
    this.requestToEnclave("reset");
  }

  /** @override parent method to call iframe */
  async reconfigure(options: Omit<IframeEnclaveOptions, "container" | "url"> = {}): Promise<void> {
    super.reconfigure(options);
    await this.requestToEnclave("reconfigure", this.options);
  }

  /** @override parent method to call iframe */
  async confirm(message: string): Promise<boolean> {
    this.showEnclave();

    try {
      return await this.requestToEnclave("confirm", message);
    } catch (error) {
      console.error(error);
      return false;
    } finally {
      this.hideEnclave();
    }
  }

  /** @override parent method to call iframe */
  async filterCredentials(
    credentials: idOSCredential[],
    privateFieldFilters: { pick: Record<string, unknown[]>; omit: Record<string, unknown[]> },
  ): Promise<idOSCredential[]> {
    return await this.requestToEnclave("filterCredentials", credentials, privateFieldFilters);
  }

  /** @override parent method to call iframe */
  async encrypt(
    message: Uint8Array,
    receiverPublicKey: Uint8Array,
  ): Promise<{ content: Uint8Array; encryptorPublicKey: Uint8Array }> {
    return this.requestToEnclave("encrypt", message, receiverPublicKey);
  }

  /** @override parent method to call iframe */
  async decrypt(
    message: Uint8Array,
    senderPublicKey: Uint8Array,
  ): Promise<Uint8Array<ArrayBufferLike>> {
    return this.requestToEnclave("decrypt", message, senderPublicKey);
  }

  /** @override parent method to call iframe */
  async backupUserEncryptionProfile(): Promise<void> {
    this.showEnclave();

    try {
      await this.requestToEnclave("backupUserEncryptionProfile");
    } catch (error) {
      console.error(error);
    } finally {
      this.hideEnclave();
    }
  }

  /** @override parent method to call iframe */
  async ensureUserEncryptionProfile(): Promise<PublicEncryptionProfile> {
    this.showEnclave();

    try {
      return await this.requestToEnclave("ensureUserEncryptionProfile");
    } finally {
      this.hideEnclave();
    }
  }

  async addAddressMessageToSign(
    address: string,
    publicKey: string | undefined,
    addressToAddType: string,
  ): Promise<AddAddressMessageToSign> {
    return this.requestToEnclave("addAddressMessageToSign", address, publicKey, addressToAddType);
  }

  async removeAddressMessageToSign(
    address: string,
    publicKey: string | undefined,
    addressToRemoveType: string,
  ): Promise<RemoveAddressMessageToSign> {
    return this.requestToEnclave(
      "removeAddressMessageToSign",
      address,
      publicKey,
      addressToRemoveType,
    );
  }

  async addAddressToMpcSecret(
    userId: string,
    message: AddAddressSignatureMessage,
    signature: string,
  ): Promise<string> {
    return this.requestToEnclave("addAddressToMpcSecret", userId, message, signature);
  }

  async removeAddressFromMpcSecret(
    userId: string,
    message: RemoveAddressSignatureMessage,
    signature: string,
  ): Promise<string> {
    return this.requestToEnclave("removeAddressFromMpcSecret", userId, message, signature);
  }

  private async createAndLoadIframe(): Promise<void> {
    const container = document.querySelector(this.container);

    if (!container) {
      throw new Error(`Can't find container with selector ${this.container}`);
    }

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
      overflow: "hidden",
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

  private async requestToEnclave<TMethod extends keyof BaseProviderMethodArgs>(
    method: TMethod,
    ...args: BaseProviderMethodArgs[TMethod]
  ): Promise<BaseProviderMethodReturn[TMethod]> {
    return new Promise((resolve, reject) => {
      const { port1, port2 } = new MessageChannel();

      port1.onmessage = ({ data }) => {
        port1.close();
        data.error ? reject(data.error) : resolve(data.result);
      };

      // biome-ignore lint/style/noNonNullAssertion: Make the explosion visible.
      this.iframe.contentWindow!.postMessage(
        {
          method,
          data: args,
        },
        this.hostUrl.origin,
        [port2],
      );
    });
  }

  private bindMessageListener(): void {
    if (!this.bound) window.addEventListener("message", this.onMessage.bind(this));
    this.bound = true;
  }

  private async onMessage(message: MessageEvent): Promise<void> {
    // We can't be sure about the message and the content
    // so we have to validate it carefully.
    if (!message || !message.data || typeof message.data !== "object") return;

    if (message.data.type !== "idOS:signTypedData" || message.origin !== this.hostUrl.origin)
      return;

    const payload = message.data.payload;
    const signature = await this.signTypedData(payload.domain, payload.types, payload.value);
    await this.requestToEnclave("signTypedDataResponse", signature);
  }
}
