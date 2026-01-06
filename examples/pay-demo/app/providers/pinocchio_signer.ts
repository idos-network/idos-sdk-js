/*
 * This is a pinocchio signer provider example.
 */

interface SessionResponse {
  address: string;
}

interface Metadata {
  name: string;
  description: string;
}

export class PinocchioSignerProvider {
  private window: Window | null = null;

  // TODO: Make this `id` request agnostic
  private resolveOpenEnclave: (() => void) | null = null;
  private resolveSignMessage: ((signature: Uint8Array) => void) | null = null;
  private resolveSessionProposal: ((response: SessionResponse) => void) | null = null;

  public address = "";

  constructor(private metadata: Metadata) {}

  async init(): Promise<string> {
    window.addEventListener("message", (event) => {
      console.log("Received message from enclave:", event.data);
      if (event.data.type === "pinocchio_ready") {
        this.resolveOpenEnclave?.();
      }

      if (event.data.type === "sign_proposal_response") {
        this.resolveSignMessage?.(event.data.data.signature);
      }

      if (event.data.type === "session_proposal_response") {
        this.resolveSessionProposal?.(event.data.data);
      }
    });

    // Ask for connection (like metamask does)
    const sessionProposal = await this.sessionProposal();

    this.address = sessionProposal.address;

    return Promise.resolve(sessionProposal.address);
  }

  async signMessage(message: Uint8Array): Promise<Uint8Array> {
    await this.openEnclave();

    const signature: Uint8Array = await new Promise((resolve) => {
      this.resolveSignMessage = resolve;

      setTimeout(() => {
        this.window?.postMessage(
          {
            type: "sign_proposal",
            data: {
              id: crypto.randomUUID(),
              data: message,
              metadata: this.metadata,
            },
          },
          "*",
        );
      }, 300);
    });

    this.resolveSignMessage = null;
    this.window?.close();
    this.window = null;

    return signature;
  }

  async sessionProposal(): Promise<{ address: string }> {
    await this.openEnclave();

    const response = await new Promise<SessionResponse>((resolve) => {
      this.resolveSessionProposal = resolve;

      setTimeout(() => {
        this.window?.postMessage(
          {
            type: "session_proposal",
            data: {
              id: crypto.randomUUID(),
              metadata: this.metadata,
            },
          },
          "*",
        );
      }, 300);
    });

    this.resolveSessionProposal = null;
    this.window?.close();
    this.window = null;

    return response;
  }

  private openEnclave() {
    return new Promise<void>((resolve) => {
      // TODO: Check if is already opened, if yes resolve immediately
      this.window = window.open("https://localhost:5174", "idOS Pinocchio", "width=350,height=600");
      this.window?.focus();
      this.resolveOpenEnclave = resolve;
    });
  }
}
