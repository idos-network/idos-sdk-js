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
  url?: string;
  throwOnUserCancelUnlock?: boolean;
}

export class IframeEnclave extends BaseProvider<IframeEnclaveOptions> {
  private iframe: HTMLIFrameElement;
  private hostUrl: URL;
  private bound = false;
  private observer?: MutationObserver | null = null;

  constructor(options: IframeEnclaveOptions) {
    super(options);

    this.hostUrl = new URL(this.options.url ?? "https://enclave.idos.network");

    // Create iframe
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

    // Iframe styles - full screen with backdrop
    const iframeStyles = {
      position: "fixed",
      inset: "0",
      width: "100%",
      height: "100%",
      border: "none",
      "background-color": "transparent",
      "z-index": "999999",
      opacity: "0",
      "pointer-events": "none",
      transition: "opacity 0.3s ease, background-color 0.3s ease",
      display: "block",
      outline: "none", // Remove focus outline
    };

    // Configure iframe
    this.iframe.allow = permissionsPolicies.join("; ");
    this.iframe.referrerPolicy = referrerPolicy;
    this.iframe.sandbox.add(...liftedSandboxRestrictions);

    // Ensure userId is available to the enclave app via search params
    const iframeUrl = new URL(this.hostUrl.toString());
    if (this.options.userId) {
      iframeUrl.searchParams.set("userId", this.options.userId);
    }
    this.iframe.src = iframeUrl.toString();
    this.iframe.tabIndex = 0; // Make iframe focusable
    this.iframe.setAttribute("aria-hidden", "true"); // Hidden by default

    // Apply iframe styles
    for (const [k, v] of Object.entries(iframeStyles)) {
      this.iframe.style.setProperty(k, v);
    }

    // Clean up any existing instances
    let existingIframe: HTMLElement | null;
    // biome-ignore lint/suspicious/noAssignInExpressions: it's on purpose
    while ((existingIframe = document.getElementById(this.iframe.id))) {
      console.log("reinstalling idOS iframe...");
      document.body.removeChild(existingIframe);
    }

    // Watch for aria-hidden being set externally and override it when visible
    this.observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.attributeName === "aria-hidden" ||
          mutation.attributeName === "data-aria-hidden"
        ) {
          if (this.iframe.style.opacity === "1") {
            // If the enclave is visible, make sure aria-hidden is removed
            this.iframe.removeAttribute("aria-hidden");
            this.iframe.removeAttribute("data-aria-hidden");
          }
        }
      });
    });

    this.observer.observe(this.iframe, { attributes: true });

    // Append iframe directly to body
    document.body.appendChild(this.iframe);

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

  destroy(): void {
    this.observer?.disconnect();
    this.iframe.remove();
  }

  private showEnclave(): void {
    this.iframe.style.opacity = "1";
    this.iframe.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
    this.iframe.style.pointerEvents = "auto";

    // Remove aria-hidden to allow interactions
    this.iframe.removeAttribute("aria-hidden");
    this.iframe.removeAttribute("data-aria-hidden");
    this.iframe.setAttribute("aria-modal", "true");
  }

  private hideEnclave(): void {
    this.iframe.style.opacity = "0";
    this.iframe.style.backgroundColor = "transparent";
    this.iframe.style.pointerEvents = "none";

    // Set aria-hidden when hidden
    this.iframe.setAttribute("aria-hidden", "true");
    this.iframe.removeAttribute("aria-modal");
  }

  private async requestToEnclave<TMethod extends keyof BaseProviderMethodArgs>(
    method: TMethod,
    ...args: BaseProviderMethodArgs[TMethod]
  ): Promise<BaseProviderMethodReturn[TMethod]> {
    return new Promise((resolve, reject) => {
      const { port1, port2 } = new MessageChannel();

      port1.onmessage = ({ data }) => {
        port1.close();
        if (data.error) {
          reject(data.error);
        } else {
          resolve(data.result);
        }
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

    if (message.origin !== this.hostUrl.origin) return;

    if (message.data.type === "idOS:signTypedData") {
      try {
        const payload = message.data.payload;
        const signature = await this.signTypedData(payload.domain, payload.types, payload.value);
        await this.requestToEnclave("signTypedDataResponse", signature);
        return;
      } catch (error) {
        console.error(error);
        await this.requestToEnclave("signTypedDataResponse", JSON.stringify(error));
        return;
      }
    }

    if (message.data.type === "idOS:enclaveClose") {
      this.hideEnclave();
    }
  }
}
