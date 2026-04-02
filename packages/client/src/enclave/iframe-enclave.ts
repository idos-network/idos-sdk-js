import type { idOSCredential } from "@idos-network/credentials/types";
import type {
  AddAddressMessageToSign,
  AddAddressSignatureMessage,
  RemoveAddressMessageToSign,
  RemoveAddressSignatureMessage,
} from "@idos-network/enclave/mpc";

import {
  BaseProvider,
  type EnclaveOptions,
  type PublicEncryptionProfile,
} from "@idos-network/enclave";

import type { BaseProviderMethodArgs, BaseProviderMethodReturn } from "./helpers";

export interface IframeEnclaveOptions extends EnclaveOptions {
  container?: string;
  url?: string;
  throwOnUserCancelUnlock?: boolean;
}

export class IframeEnclave extends BaseProvider<IframeEnclaveOptions> {
  private iframe: HTMLIFrameElement;
  private hostUrl: URL;
  private bound = false;
  private boundOnMessage?: (message: MessageEvent) => Promise<void>;

  constructor(options: IframeEnclaveOptions) {
    super(options);

    this.hostUrl = new URL(this.options.url ?? "https://enclave.idos.network");
    this.iframe = document.createElement("iframe");
    this.iframe.id = `idos-enclave-iframe-${crypto.randomUUID()}`;
  }

  /** @see parent method */
  async load(): Promise<void> {
    await this.createAndLoadIframe();
    await this.requestToEnclave("load");
    await this.reconfigure();
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

  destroy(): void {
    if (this.boundOnMessage) {
      window.removeEventListener("message", this.boundOnMessage);
      this.bound = false;
    }
    this.iframe.remove();
  }

  private async createAndLoadIframe(): Promise<void> {
    // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Permissions-Policy#directives
    const permissionsPolicies = ["publickey-credentials-get", "storage-access"];

    // https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe#sandbox
    const liftedSandboxRestrictions = ["forms", "modals", "same-origin", "scripts"].map(
      (toLift) => `allow-${toLift}`,
    );

    // https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe#referrerpolicy
    const referrerPolicy = "origin";

    const iframeStyles: Record<string, string> = {
      position: "fixed",
      inset: "0",
      width: "100%",
      height: "100%",
      border: "none",
      "background-color": "transparent",
      "z-index": "2147483647",
      opacity: "0",
      "pointer-events": "none",
      transition: "opacity 0.3s ease",
      display: "block",
      outline: "none",
    };

    this.iframe.allow = permissionsPolicies.join("; ");
    this.iframe.referrerPolicy = referrerPolicy;
    this.iframe.sandbox.add(...liftedSandboxRestrictions);
    this.iframe.src = this.hostUrl.toString();
    this.iframe.tabIndex = 0;
    this.iframe.setAttribute("aria-hidden", "true");

    for (const [k, v] of Object.entries(iframeStyles)) {
      this.iframe.style.setProperty(k, v);
    }

    let existingIframe: HTMLElement | null;
    // oxlint-disable-next-line no-cond-assign -- it's on purpose
    while ((existingIframe = document.getElementById(this.iframe.id))) {
      existingIframe.remove();
    }

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

  private showEnclave(): void {
    this.iframe.style.opacity = "1";
    this.iframe.style.pointerEvents = "auto";
    this.iframe.removeAttribute("aria-hidden");
    this.iframe.setAttribute("aria-modal", "true");
  }

  private hideEnclave(): void {
    this.iframe.style.opacity = "0";
    this.iframe.style.pointerEvents = "none";
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

      // oxlint-disable-next-line typescript/no-non-null-assertion -- iframe contentWindow exists after load.
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
    if (!this.bound) {
      this.boundOnMessage = this.onMessage.bind(this);
      window.addEventListener("message", this.boundOnMessage);
    }
    this.bound = true;
  }

  private async onMessage(message: MessageEvent): Promise<void> {
    if (!message || !message.data || typeof message.data !== "object") return;
    if (message.origin !== this.hostUrl.origin) return;

    if (message.data.type === "idOS:enclaveHide") {
      this.hideEnclave();
      return;
    }

    if (message.data.type === "idOS:enclaveShow") {
      this.showEnclave();
      return;
    }

    if (message.data.type === "idOS:signTypedData") {
      const payload = message.data.payload;
      try {
        const signature = await this.signTypedData(payload.domain, payload.types, payload.value);
        await this.requestToEnclave("signTypedDataResponse", signature);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        await this.requestToEnclave("signTypedDataError", errorMessage);
      }
      return;
    }

    if (message.data.type === "idOS:enclaveClose") {
      this.hideEnclave();
    }
  }
}
