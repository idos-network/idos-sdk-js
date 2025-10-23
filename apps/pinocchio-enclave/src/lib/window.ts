import type { SessionProposal, SignProposal } from "@/contexts/requests";

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
  async init() {
    window.addEventListener("message", this.messageListener);

    // Send ready event to parent window
    window.opener?.postMessage({ type: "pinocchio_ready" }, "*");

    return true;
  }

  destruct(): void {
    window.removeEventListener("message", this.messageListener);
  }

  messageListener = (event: MessageEvent) => {
    const { type, data } = event.data;

    console.log("WindowMessageHandler received message:", event);

    if (type === "session_proposal") {
      this.addSessionProposal({
        ...data,
        callback: (approved: boolean) => {
          window.opener?.postMessage(
            {
              type: "session_proposal_response",
              data: {
                id: data.id,
                approved,
              },
            },
            "*",
          );
        },
      });
    } else if (type === "sign_proposal") {
      this.addSignProposal({
        ...data,
        callback: (signature: string | null) => {
          window.opener?.postMessage(
            {
              type: "sign_proposal_response",
              data: {
                id: data.id,
                signature,
              },
            },
            "*",
          );
        },
      });
    }
  };
}
