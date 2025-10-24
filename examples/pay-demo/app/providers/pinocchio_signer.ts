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

function hexToUint8Array(hex: string): Uint8Array {
  // biome-ignore lint/style/noParameterAssign: modifying parameter for convenience
  if (hex.startsWith("0x")) hex = hex.slice(2); // remove optional 0x prefix
  if (hex.length % 2 !== 0) throw new Error("Invalid hex string");
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = Number.parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
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
        this.resolveSignMessage?.(hexToUint8Array(event.data.data.signature));
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
