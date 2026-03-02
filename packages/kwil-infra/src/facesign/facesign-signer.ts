const TRANSITION_MS = 200;
// Buffer after showing the iframe before posting a message, giving the enclave time to be ready.
const POST_MESSAGE_DELAY_MS = 300;
// Safety net: reject proposals if the enclave doesn't respond within this window.
const PROPOSAL_TIMEOUT_MS = 2 * 60 * 1000;

export interface FaceSignMetadata {
  name: string;
  description: string;
}

export interface FaceSignSignerProviderOptions {
  metadata: FaceSignMetadata;
  enclaveUrl: string;
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
  #resolveAddressRequest: ((address: string | null) => void) | null = null;
  #resolveHandoffToken: ((address: string) => void) | null = null;
  #rejectHandoffToken: ((error: Error) => void) | null = null;

  #messageListener: ((event: MessageEvent) => void) | null = null;
  #proposalId = 0;
  #hasKey: boolean | null = null;
  #metadata: FaceSignMetadata;
  #enclaveUrl: string;
  #enclaveOrigin: string;

  signatureType = "ed25519";
  walletType = "FaceSign";
  publicAddress = "";
  publicKey = "";

  constructor(options: FaceSignSignerProviderOptions) {
    this.#metadata = options.metadata;
    this.#enclaveUrl = options.enclaveUrl;
    this.#enclaveOrigin = new URL(options.enclaveUrl).origin;
  }

  #setupMessageListener(): void {
    if (this.#messageListener) {
      window.removeEventListener("message", this.#messageListener);
    }

    this.#messageListener = (event: MessageEvent) => {
      if (event.origin !== this.#enclaveOrigin) return;

      if (event.data?.type === "facesign_ready") {
        this.#hasKey = !!event.data.hasKey;
        this.#resolveOpenEnclave?.();
      }

      if (event.data?.type === "sign_proposal_response") {
        const payload = event.data.data;
        if (!payload) return;

        if (payload.signature) {
          this.#resolveSignMessage?.(new Uint8Array(payload.signature));
        } else {
          this.#rejectSignMessage?.(new Error("Sign request rejected by user"));
        }
      }

      if (event.data?.type === "session_proposal_response") {
        const payload = event.data.data;
        if (!payload) return;

        if (payload.approved && payload.address) {
          this.#resolveSessionProposal?.({ address: payload.address });
        } else {
          this.#rejectSessionProposal?.(new Error("Session request rejected by user"));
        }
      }

      if (event.data?.type === "address_response") {
        const payload = event.data.data;
        this.#resolveAddressRequest?.(payload?.address ?? null);
      }

      if (event.data?.type === "handoff_token_response") {
        const payload = event.data.data;
        if (!payload) return;

        if (payload.address) {
          this.#resolveHandoffToken?.(payload.address);
        } else {
          this.#rejectHandoffToken?.(
            new Error(payload.error ?? "Handoff token rejected by enclave"),
          );
        }
      }
    };

    window.addEventListener("message", this.#messageListener);
  }

  async preload(): Promise<{ hasKey: boolean }> {
    this.#setupMessageListener();
    await this.#ensureEnclave();
    return { hasKey: this.#hasKey ?? false };
  }

  async init(): Promise<string> {
    this.#setupMessageListener();

    const sessionProposal = await this.#sessionProposal();

    this.publicKey = sessionProposal.address;
    this.publicAddress = sessionProposal.address;

    return sessionProposal.address;
  }

  async getAddress(): Promise<string | null> {
    this.#setupMessageListener();
    await this.#ensureEnclave();

    if (!this.#hasKey) return null;

    return new Promise<string | null>((resolve) => {
      const timer = setTimeout(() => resolve(null), PROPOSAL_TIMEOUT_MS);

      this.#resolveAddressRequest = (address) => {
        clearTimeout(timer);
        this.#resolveAddressRequest = null;
        if (address) {
          this.publicKey = address;
          this.publicAddress = address;
        }
        resolve(address);
      };

      this.#iframe?.contentWindow?.postMessage(
        { type: "address_request", data: { id: ++this.#proposalId } },
        this.#enclaveUrl,
      );
    });
  }

  get signer(): this {
    return this;
  }

  async signMessage(message: Uint8Array | string): Promise<Uint8Array> {
    await this.#showEnclave();

    const messageToSign = typeof message === "string" ? new TextEncoder().encode(message) : message;

    try {
      return await new Promise<Uint8Array>((resolve, reject) => {
        const timer = setTimeout(() => {
          reject(new Error("FaceSign sign request timed out"));
        }, PROPOSAL_TIMEOUT_MS);

        this.#resolveSignMessage = (sig) => {
          clearTimeout(timer);
          resolve(sig);
        };
        this.#rejectSignMessage = (err) => {
          clearTimeout(timer);
          reject(err);
        };

        setTimeout(() => {
          this.#iframe?.contentWindow?.postMessage(
            {
              type: "sign_proposal",
              data: {
                id: ++this.#proposalId,
                data: messageToSign,
                metadata: this.#metadata,
              },
            },
            this.#enclaveUrl,
          );
        }, POST_MESSAGE_DELAY_MS);
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
        const timer = setTimeout(() => {
          reject(new Error("FaceSign session proposal timed out"));
        }, PROPOSAL_TIMEOUT_MS);

        this.#resolveSessionProposal = (res) => {
          clearTimeout(timer);
          resolve(res);
        };
        this.#rejectSessionProposal = (err) => {
          clearTimeout(timer);
          reject(err);
        };

        setTimeout(() => {
          this.#iframe?.contentWindow?.postMessage(
            {
              type: "session_proposal",
              data: {
                id: ++this.#proposalId,
                metadata: this.#metadata,
              },
            },
            this.#enclaveUrl,
          );
        }, POST_MESSAGE_DELAY_MS);
      });
    } finally {
      this.#resolveSessionProposal = null;
      this.#rejectSessionProposal = null;
      await this.#hideEnclave();
    }
  }

  async completeHandoff(attestationToken: string): Promise<string> {
    this.#setupMessageListener();
    await this.#ensureEnclave();

    return new Promise<string>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error("FaceSign handoff timed out"));
      }, PROPOSAL_TIMEOUT_MS);

      this.#resolveHandoffToken = (address) => {
        clearTimeout(timer);
        this.#resolveHandoffToken = null;
        this.#rejectHandoffToken = null;
        this.publicKey = address;
        this.publicAddress = address;
        resolve(address);
      };

      this.#rejectHandoffToken = (err) => {
        clearTimeout(timer);
        this.#resolveHandoffToken = null;
        this.#rejectHandoffToken = null;
        reject(err);
      };

      this.#iframe?.contentWindow?.postMessage(
        {
          type: "handoff_token",
          data: { id: ++this.#proposalId, attestationToken },
        },
        this.#enclaveUrl,
      );
    });
  }

  hide(): Promise<void> {
    this.#cancelPendingProposals();
    return this.#hideEnclave();
  }

  #cancelPendingProposals(): void {
    const cancelError = new Error("FaceSign operation cancelled");

    if (this.#rejectSignMessage) {
      this.#rejectSignMessage(cancelError);
      this.#resolveSignMessage = null;
      this.#rejectSignMessage = null;
    }

    if (this.#rejectSessionProposal) {
      this.#rejectSessionProposal(cancelError);
      this.#resolveSessionProposal = null;
      this.#rejectSessionProposal = null;
    }

    if (this.#rejectHandoffToken) {
      this.#rejectHandoffToken(cancelError);
      this.#resolveHandoffToken = null;
      this.#rejectHandoffToken = null;
    }
  }

  destroy(): void {
    this.#cancelPendingProposals();
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
      zIndex: "99999",
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

    return new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error("FaceSign enclave failed to load"));
      }, PROPOSAL_TIMEOUT_MS);

      if (!this.#container) {
        this.#container = this.#createContainer();
      }

      this.#iframe = document.createElement("iframe");
      this.#iframe.src = this.#enclaveUrl;
      this.#iframe.title = "FaceSign Enclave";
      this.#iframe.allow = "camera; fullscreen";
      this.#iframe.style.cssText = "width:100%;height:100%;border:none;";

      this.#container.appendChild(this.#iframe);

      this.#resolveOpenEnclave = () => {
        clearTimeout(timer);
        resolve();
      };
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

  #destroyEnclave(): void {
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
