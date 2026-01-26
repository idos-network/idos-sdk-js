import type { SessionProposal, SignProposal } from "@/contexts/requests";
import { env } from "@/env";

export class BaseHandler {
  constructor(
    protected addSignProposal: (proposal: SignProposal) => void,
    protected addSessionProposal: (proposal: SessionProposal) => void,
  ) {}

  init(): Promise<boolean> {
    return Promise.resolve(true);
  }

  destruct(): void {
    // Nothing to clean up by default
  }
}

export class WindowMessageHandler extends BaseHandler {
  private isIframe: boolean;
  private parentWindow: Window | null;
  private allowedOrigins: string[];

  constructor(
    addSignProposal: (proposal: SignProposal) => void,
    addSessionProposal: (proposal: SessionProposal) => void,
  ) {
    super(addSignProposal, addSessionProposal);

    // Detect if running in iframe or popup window
    this.isIframe = window.self !== window.top;
    this.parentWindow = this.isIframe ? window.parent : window.opener;

    // Parse allowed origins from environment
    this.allowedOrigins = env.VITE_ALLOWED_ORIGINS?.split(",").map((o: string) => o.trim()) || [
      "*",
    ];

    console.log(`Pinocchio Enclave initialized in ${this.isIframe ? "iframe" : "popup"} mode`);
    console.log(
      `Allowed origins: ${this.allowedOrigins.includes("*") ? "* (all origins)" : this.allowedOrigins.join(", ")}`,
    );
  }

  async init() {
    window.addEventListener("message", this.messageListener);

    // Send ready event to parent window
    this.sendToParent({ type: "pinocchio_ready" });

    return true;
  }

  destruct(): void {
    window.removeEventListener("message", this.messageListener);
  }

  /**
   * Validates if a message origin is allowed based on the configured allowlist
   */
  private isOriginAllowed(origin: string): boolean {
    // Allow all origins if wildcard is configured
    if (this.allowedOrigins.includes("*")) {
      return true;
    }

    // Check if origin is in the allowlist
    return this.allowedOrigins.includes(origin);
  }

  /**
   * Sends a message to the parent window (iframe parent or popup opener)
   */
  private sendToParent(message: Record<string, unknown>, targetOrigin = "*"): void {
    if (!this.parentWindow) {
      console.warn("No parent window available to send message to");
      return;
    }

    try {
      this.parentWindow.postMessage(message, targetOrigin);
    } catch (error) {
      console.error("Failed to send message to parent:", error);
    }
  }

  messageListener = (event: MessageEvent) => {
    // Validate origin
    if (!this.isOriginAllowed(event.origin)) {
      console.warn(`Blocked message from unauthorized origin: ${event.origin}`);
      return;
    }

    const { type, data } = event.data;

    if (type === "session_proposal") {
      this.addSessionProposal({
        ...data,
        callback: (approved: boolean, address?: string) => {
          this.sendToParent(
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
          this.sendToParent(
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
    }
  };
}
