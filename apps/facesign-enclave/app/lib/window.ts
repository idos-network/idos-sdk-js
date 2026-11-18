import type { SessionProposal, SignProposal } from "@/providers/requests.provider";

import { env } from "@/env";
import { approveOrigin, clearKeyMaterial, isOriginApproved } from "@/lib/keys";

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

  constructor(
    addSignProposal: (proposal: SignProposal) => void,
    addSessionProposal: (proposal: SessionProposal) => void,
    isKeyAvailable: boolean,
    getStoredAddress?: () => Promise<string>,
  ) {
    super(addSignProposal, addSessionProposal);

    this.#isKeyAvailable = isKeyAvailable;
    this.#getStoredAddress = getStoredAddress ?? null;
    this.#isIframe = window.self !== window.top;
    this.#parentWindow = this.#isIframe ? window.parent : window.opener;
    this.#allowedOrigins = parseAllowedOrigins(env.VITE_ALLOWED_ORIGINS);

    console.log(`FaceSign Enclave initialized in ${this.#isIframe ? "iframe" : "popup"} mode`);
    console.log(`Allowed origins: ${this.#allowedOrigins.join(", ") || "(none)"}`);
  }

  async init() {
    window.addEventListener("message", this.#messageListener);

    // The parent's origin is unknown here, so target each allowed origin; the browser
    // drops the ones that don't match. Never "*": hasKey must not reach arbitrary embedders.
    for (const origin of this.#allowedOrigins) {
      this.#sendToParent({ type: "facesign_ready", hasKey: this.#isKeyAvailable }, origin);
    }

    return true;
  }

  destruct(): void {
    window.removeEventListener("message", this.#messageListener);
  }

  #isOriginAllowed(origin: string): boolean {
    return this.#allowedOrigins.includes(origin);
  }

  #sendToParent(message: Record<string, unknown>, targetOrigin: string): void {
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
        // Assigned after the spread so a payload origin cannot replace the verified one.
        origin: event.origin,
        callback: (approved: boolean, address?: string) => {
          // Remember the consent so this origin can later read the address via address_request.
          (approved ? approveOrigin(event.origin) : Promise.resolve())
            .catch((error) => console.error("Failed to store origin approval:", error))
            .then(() =>
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
              ),
            );
        },
      });
    } else if (type === "sign_proposal") {
      this.addSignProposal({
        ...data,
        // Assigned after the spread so a payload origin cannot replace the verified one.
        origin: event.origin,
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
    } else if (type === "reset") {
      clearKeyMaterial()
        .then(() => {
          this.#isKeyAvailable = false;
          this.#sendToParent(
            { type: "reset_complete", data: { id: data?.id, ok: true } },
            event.origin,
          );
        })
        .catch(() => {
          this.#sendToParent(
            { type: "reset_complete", data: { id: data?.id, ok: false } },
            event.origin,
          );
        });
    } else if (type === "address_request") {
      const getStoredAddress = this.#getStoredAddress;
      // Only origins the user already approved a session for get the address without a prompt.
      const lookup =
        this.#isKeyAvailable && getStoredAddress
          ? isOriginApproved(event.origin).then((ok) => (ok ? getStoredAddress() : null))
          : Promise.resolve(null);

      lookup
        .catch(() => null)
        .then((address) => {
          this.#sendToParent(
            { type: "address_response", data: { id: data.id, address } },
            event.origin,
          );
        });
    }
  };
}

/** Parses VITE_ALLOWED_ORIGINS. Wildcards are not supported: every origin must be listed. */
export function parseAllowedOrigins(raw: string | undefined): string[] {
  const origins = (raw ?? "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

  if (origins.includes("*")) {
    console.error(
      'VITE_ALLOWED_ORIGINS: "*" is not supported and is ignored. List origins explicitly.',
    );
  }

  return origins.filter((o) => o !== "*");
}
