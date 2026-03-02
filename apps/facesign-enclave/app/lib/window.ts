import { env } from "@/env";
import type { SessionProposal, SignProposal } from "@/providers/requests.provider";

export class BaseHandler {
  addSignProposal: (proposal: SignProposal) => void;
  addSessionProposal: (proposal: SessionProposal) => void;

  constructor(
    addSignProposal: (proposal: SignProposal) => void,
    addSessionProposal: (proposal: SessionProposal) => void,
  ) {
    this.addSignProposal = addSignProposal;
    this.addSessionProposal = addSessionProposal;
  }

  init(): Promise<boolean> {
    return Promise.resolve(true);
  }

  destruct(): void {
    // Nothing to clean up by default
  }
}

export class WindowMessageHandler extends BaseHandler {
  #isIframe: boolean;
  #parentWindow: Window | null;
  #allowedOrigins: string[];
  #isKeyAvailable: boolean;
  #getStoredAddress: (() => Promise<string>) | null;
  #onHandoffToken: ((attestationToken: string) => Promise<string>) | null;

  constructor(
    addSignProposal: (proposal: SignProposal) => void,
    addSessionProposal: (proposal: SessionProposal) => void,
    isKeyAvailable: boolean,
    getStoredAddress?: () => Promise<string>,
    onHandoffToken?: (attestationToken: string) => Promise<string>,
  ) {
    super(addSignProposal, addSessionProposal);

    this.#isKeyAvailable = isKeyAvailable;
    this.#getStoredAddress = getStoredAddress ?? null;
    this.#onHandoffToken = onHandoffToken ?? null;
    this.#isIframe = window.self !== window.top;
    this.#parentWindow = this.#isIframe ? window.parent : window.opener;
    this.#allowedOrigins = env.VITE_ALLOWED_ORIGINS.split(",").map((o: string) => o.trim()) || [
      "*",
    ];

    console.log(`FaceSign Enclave initialized in ${this.#isIframe ? "iframe" : "popup"} mode`);
    console.log(
      `Allowed origins: ${this.#allowedOrigins.includes("*") ? "* (all origins)" : this.#allowedOrigins.join(", ")}`,
    );
  }

  async init() {
    window.addEventListener("message", this.#messageListener);

    this.#sendToParent({ type: "facesign_ready", hasKey: this.#isKeyAvailable });

    return true;
  }

  destruct(): void {
    window.removeEventListener("message", this.#messageListener);
  }

  #isOriginAllowed(origin: string): boolean {
    if (this.#allowedOrigins.includes("*")) {
      return true;
    }
    return this.#allowedOrigins.includes(origin);
  }

  #sendToParent(message: Record<string, unknown>, targetOrigin = "*"): void {
    if (!this.#parentWindow) {
      console.warn("No parent window available to send message to");
      return;
    }

    try {
      this.#parentWindow.postMessage(message, targetOrigin);
    } catch (error) {
      console.error("Failed to send message to parent:", error);
    }
  }

  #messageListener = (event: MessageEvent) => {
    if (!this.#isOriginAllowed(event.origin)) {
      console.warn(`Blocked message from unauthorized origin: ${event.origin}`);
      return;
    }

    const { type, data } = event.data;

    if (type === "session_proposal") {
      this.addSessionProposal({
        ...data,
        callback: (approved: boolean, address?: string) => {
          this.#sendToParent(
            {
              type: "session_proposal_response",
              data: {
                id: data.id,
                approved,
                address,
              },
            },
            event.origin,
          );
        },
      });
    } else if (type === "sign_proposal") {
      this.addSignProposal({
        ...data,
        callback: (signature: string | null) => {
          this.#sendToParent(
            {
              type: "sign_proposal_response",
              data: {
                id: data.id,
                signature,
              },
            },
            event.origin,
          );
        },
      });
    } else if (type === "address_request") {
      if (this.#isKeyAvailable && this.#getStoredAddress) {
        this.#getStoredAddress()
          .then((address) => {
            this.#sendToParent(
              { type: "address_response", data: { id: data.id, address } },
              event.origin,
            );
          })
          .catch(() => {
            this.#sendToParent(
              { type: "address_response", data: { id: data.id, address: null } },
              event.origin,
            );
          });
      } else {
        this.#sendToParent(
          { type: "address_response", data: { id: data.id, address: null } },
          event.origin,
        );
      }
    } else if (type === "handoff_token") {
      if (this.#onHandoffToken && data?.attestationToken) {
        this.#onHandoffToken(data.attestationToken)
          .then((address) => {
            this.#sendToParent(
              { type: "handoff_token_response", data: { id: data.id, address } },
              event.origin,
            );
          })
          .catch((err) => {
            this.#sendToParent(
              {
                type: "handoff_token_response",
                data: { id: data.id, error: err instanceof Error ? err.message : "Unknown error" },
              },
              event.origin,
            );
          });
      } else {
        this.#sendToParent(
          {
            type: "handoff_token_response",
            data: { id: data.id, error: "Handoff not supported" },
          },
          event.origin,
        );
      }
    }
  };
}
