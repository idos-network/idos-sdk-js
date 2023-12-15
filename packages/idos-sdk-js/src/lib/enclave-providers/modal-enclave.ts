import { EnclaveProvider, StoredData } from "./enclave-provider";

export class ModalEnclave extends EnclaveProvider {
  hostUrl = new URL(import.meta.env.VITE_IDOS_ENCLAVE_URL);

  container: string;
  iframe: HTMLIFrameElement;
  modal: HTMLDialogElement;

  constructor(options: { container: string }) {
    super();

    this.container = options.container;
    this.iframe = document.createElement('iframe');
    this.modal = document.createElement('dialog');
  }

  async load(): Promise<StoredData> {
    await this.#loadEnclave();

    return (await this.#requestToEnclave({ storage: {} })) as StoredData;
  }

  async init(humanId?: string, signerAddress?: string, signerPublicKey?: string): Promise<Uint8Array> {
    let { encryptionPublicKey } = (await this.#requestToEnclave({
      storage: { humanId, signerAddress, signerPublicKey },
    })) as { encryptionPublicKey: Uint8Array };

    if (encryptionPublicKey) return encryptionPublicKey;

    const password = this.password("please give password")

    return this.#requestToEnclave({ setPassword: { password: password } }) as Promise<Uint8Array>;
  }

  async store(key: string, value: string): Promise<string> {
    return this.#requestToEnclave({ storage: { [key]: value } }) as Promise<string>;
  }

  async reset(): Promise<void> {
    this.#requestToEnclave({ reset: {} });
  }

  openModal() {}

  resetModal() {
    const children = Array.from(this.modal.children);

    children.forEach((child: Element) => child.remove());
  }

  password(message: string): Promise<string>{
    this.resetModal();

    const h1 = document.createElement('h1');
    h1.textContent = message;
    this.modal.appendChild(h1);

    const passwordForm = document.createElement("form");
    passwordForm.style.display = "block";

    const submitInput = document.createElement("input")
    submitInput.type = "submit";
    submitInput.name = "Submit";
    passwordForm.appendChild(submitInput);

    const passwordInput = document.createElement("input")
    passwordInput.type = "password";
    passwordInput.name = "password";
    passwordForm.appendChild(passwordInput);

    this.modal.appendChild(passwordForm);
    this.modal.showModal();

    return new Promise((resolve, reject) =>
      passwordForm.addEventListener("submit", (e) => {
        e.preventDefault();

        if (e.target) {
          const entries = new FormData(passwordForm);
          const password = entries.get('password');
          this.modal.close();

          resolve(password?.toString() || '');
        }
        reject();
      })
    );
  }

  confirm(message: string): Promise<boolean> {
    this.resetModal();

    console.log(`CONFIRM: ${message}`);
    const h1 = document.createElement("h1")
    h1.textContent = message;
    this.modal.appendChild(h1);

    const cancelButton = document.createElement("button");
    cancelButton.innerHTML = 'Cancel';

    const confirmButton = document.createElement("button");
    confirmButton.innerHTML = 'Confirm';

    return new Promise((resolve) => {
      this.modal.appendChild(cancelButton);
      this.modal.appendChild(confirmButton);
      this.modal.showModal();

      cancelButton.onclick = () => {
        this.modal.close();

        resolve(false);
      }
      confirmButton.onclick = () => {
        this.modal.close();

        resolve(true);
      }
    });
  }

  async encrypt(message: Uint8Array, receiverPublicKey: Uint8Array): Promise<Uint8Array> {
    return this.#requestToEnclave({ encrypt: { message, receiverPublicKey } }) as Promise<Uint8Array>;
  }

  async decrypt(message: Uint8Array, senderPublicKey: Uint8Array): Promise<Uint8Array> {
    return this.#requestToEnclave({ decrypt: { fullMessage: message, senderPublicKey } }) as Promise<Uint8Array>;
  }

  #loadEnclave() {
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

    const container = document.querySelector(this.container);
    if (!container) throw new Error(`Can't find container with selector ${this.container}`);

    container.appendChild(this.iframe);
    container.appendChild(this.modal);

    // this.modal.showModal();
    
    return new Promise((resolve) => this.iframe.addEventListener("load", resolve));
  }

  async #requestToEnclave(request: any) {
    return new Promise((resolve, reject) => {
      const { port1, port2 } = new MessageChannel();

      port1.onmessage = ({ data }) => {
        port1.close();
        data.error ? reject(data.error) : resolve(data.result);
      };

      this.iframe.contentWindow!.postMessage(request, this.hostUrl.origin, [port2]);
    });
  }
}
