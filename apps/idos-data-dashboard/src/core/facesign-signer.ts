const FACESIGN_URL = import.meta.env.VITE_FACESIGN_ENCLAVE_URL;
const TRANSITION_MS = 200;

interface Metadata {
  name: string;
  description: string;
}

interface SessionResponse {
  address: string;
}

export class FaceSignSignerProvider {
  #iframe: HTMLIFrameElement | null = null;
  #container: HTMLElement | null = null;

  #resolveOpenEnclave: (() => void) | null = null;
  #resolveSignMessage: ((signature: Uint8Array) => void) | null = null;
  #rejectSignMessage: ((error: Error) => void) | null = null;
  #resolveSessionProposal: ((response: SessionResponse) => void) | null = null;
  #rejectSessionProposal: ((error: Error) => void) | null = null;

  #messageListener: ((event: MessageEvent) => void) | null = null;
  #proposalId = 0;
  #metadata: Metadata;

  signatureType = "ed25519";
  walletType = "FaceSign";
  publicAddress = "";
  publicKey = "";

  constructor(metadata: Metadata) {
    this.#metadata = metadata;
  }

  async init(): Promise<string> {
    this.#messageListener = (event: MessageEvent) => {
      if (event.data?.type === "facesign_ready") {
        this.#resolveOpenEnclave?.();
      }

      if (event.data?.type === "sign_proposal_response") {
        const { signature } = event.data.data;
        if (signature) {
          this.#resolveSignMessage?.(new Uint8Array(signature));
        } else {
          this.#rejectSignMessage?.(new Error("Sign request rejected by user"));
        }
      }

      if (event.data?.type === "session_proposal_response") {
        const { approved, address } = event.data.data;
        if (approved && address) {
          this.#resolveSessionProposal?.({ address });
        } else {
          this.#rejectSessionProposal?.(new Error("Session request rejected by user"));
        }
      }
    };

    window.addEventListener("message", this.#messageListener);

    const sessionProposal = await this.#sessionProposal();

    this.publicKey = sessionProposal.address;
    this.publicAddress = sessionProposal.address;

    return sessionProposal.address;
  }

  get signer() {
    return this;
  }

  async signMessage(message: Uint8Array): Promise<Uint8Array> {
    await this.#showEnclave();

    let messageToSign: Uint8Array = message;
    if (typeof message === "string") {
      messageToSign = new TextEncoder().encode(message);
    }

    try {
      return await new Promise<Uint8Array>((resolve, reject) => {
        this.#resolveSignMessage = resolve;
        this.#rejectSignMessage = reject;

        setTimeout(() => {
          this.#iframe?.contentWindow?.postMessage(
            {
              type: "sign_proposal",
              data: {
                id: ++this.#proposalId,
                data: Array.from(messageToSign),
                metadata: this.#metadata,
              },
            },
            FACESIGN_URL,
          );
        }, 300);
      });
    } finally {
      this.#resolveSignMessage = null;
      this.#rejectSignMessage = null;
      await this.#hideEnclave();
    }
  }

  async #sessionProposal(): Promise<SessionResponse> {
    await this.#ensureEnclave();
    await this.#showEnclave();

    try {
      return await new Promise<SessionResponse>((resolve, reject) => {
        this.#resolveSessionProposal = resolve;
        this.#rejectSessionProposal = reject;

        setTimeout(() => {
          this.#iframe?.contentWindow?.postMessage(
            {
              type: "session_proposal",
              data: {
                id: ++this.#proposalId,
                metadata: this.#metadata,
              },
            },
            FACESIGN_URL,
          );
        }, 300);
      });
    } finally {
      this.#resolveSessionProposal = null;
      this.#rejectSessionProposal = null;
      this.#hideEnclave();
    }
  }

  destroy() {
    if (this.#messageListener) {
      window.removeEventListener("message", this.#messageListener);
      this.#messageListener = null;
    }
    this.#destroyEnclave();
  }

  #createContainer(): HTMLElement {
    const container = document.createElement("div");
    Object.assign(container.style, {
      position: "fixed",
      top: "0",
      left: "0",
      width: "100%",
      height: "100%",
      zIndex: "9999",
      background: "#0a0a0a",
      display: "none",
      opacity: "0",
      transition: `opacity ${TRANSITION_MS}ms ease-in-out`,
    });
    document.body.appendChild(container);
    return container;
  }

  #ensureEnclave(): Promise<void> {
    if (this.#iframe?.contentWindow) {
      return Promise.resolve();
    }

    return new Promise<void>((resolve) => {
      if (!this.#container) {
        this.#container = this.#createContainer();
      }

      this.#iframe = document.createElement("iframe");
      this.#iframe.src = FACESIGN_URL;
      this.#iframe.title = "FaceSign Enclave";
      this.#iframe.allow = "camera; fullscreen";
      this.#iframe.style.cssText = "width:100%;height:100%;border:none;";

      this.#container.appendChild(this.#iframe);

      this.#resolveOpenEnclave = resolve;
    });
  }

  #showEnclave(): Promise<void> {
    const el = this.#container;
    if (!el) return Promise.resolve();

    return new Promise((resolve) => {
      el.style.display = "flex";
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          el.style.opacity = "1";
          setTimeout(resolve, TRANSITION_MS);
        });
      });
    });
  }

  #hideEnclave(): Promise<void> {
    const el = this.#container;
    if (!el) return Promise.resolve();

    return new Promise((resolve) => {
      el.style.opacity = "0";
      setTimeout(() => {
        el.style.display = "none";
        resolve();
      }, TRANSITION_MS);
    });
  }

  #destroyEnclave() {
    if (this.#iframe) {
      this.#iframe.remove();
      this.#iframe = null;
    }
    if (this.#container) {
      this.#container.remove();
      this.#container = null;
    }
  }
}
