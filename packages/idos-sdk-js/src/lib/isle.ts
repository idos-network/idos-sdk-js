/* cspell:disable-next-line */
import { type ChannelInstance, type Controller, createController } from "@sanity/comlink";

export type idOSIsleTheme = "light" | "dark";
export type idOSIsleStatus =
  | "disconnected"
  | "no-profile"
  | "not-verified"
  | "pending-verification"
  | "verified"
  | "error";

interface idOSIsleConstructorOptions {
  container: string;
  theme?: idOSIsleTheme;
}

type ControllerMessage =
  | {
      type: "initialize";
      data: {
        theme?: idOSIsleTheme;
      };
    }
  | {
      type: "update";
      data: {
        theme?: idOSIsleTheme;
        status?: idOSIsleStatus;
      };
    };

type NodeMessage =
  | {
      type: "initialized";
      data: {
        theme: idOSIsleTheme;
        status: idOSIsleStatus;
      };
    }
  | {
      type: "updated";
      data: {
        theme: idOSIsleTheme;
        status: idOSIsleStatus;
      };
    };

type MessageHandler = (message: NodeMessage) => void;

export class idOSIsle {
  private static instances = new Map<string, idOSIsle>();

  private iframe: HTMLIFrameElement | null = null;
  private containerId: string;
  private controller: Controller;
  private channel: ChannelInstance<ControllerMessage, NodeMessage> | null = null;
  private theme?: idOSIsleTheme;
  private iframeId: string;

  private constructor(options: idOSIsleConstructorOptions) {
    this.containerId = options.container;
    this.theme = options.theme;
    this.iframeId = `iframe-isle-${Math.random().toString(36).slice(2, 9)}`;
    this.controller = createController({
      targetOrigin: "https://localhost:5174",
    });

    const container = document.getElementById(this.containerId);
    if (!container) {
      throw new Error(`Element with id "${this.containerId}" not found`);
    }

    // Check if iframe already exists in the container
    const existingIframe = container.querySelector("iframe") as HTMLIFrameElement;
    if (existingIframe) {
      this.iframe = existingIframe;
      idOSIsle.instances.set(this.containerId, this);
      return;
    }

    // Create new iframe if none exists
    this.iframe = document.createElement("iframe");
    this.iframe.id = this.iframeId;
    this.iframe.src = "https://localhost:5174";
    this.iframe.style.width = "100%";
    this.iframe.style.height = "100%";
    this.iframe.style.border = "none";

    container.appendChild(this.iframe);
    this.setupController();
    idOSIsle.instances.set(this.containerId, this);
  }

  private setupController(): void {
    if (!this.iframe?.contentWindow) return;

    this.controller.addTarget(this.iframe.contentWindow);

    this.channel = this.controller.createChannel({
      connectTo: "iframe",
      heartbeat: true,
      name: "window",
    });

    this.channel.start();
    this.channel.post("initialize", {
      theme: this.theme,
    });
  }

  static initialize(options: idOSIsleConstructorOptions): idOSIsle {
    const existingInstance = idOSIsle.instances.get(options.container);
    if (existingInstance) {
      return existingInstance;
    }

    return new idOSIsle(options);
  }

  public send(type: ControllerMessage["type"], data: ControllerMessage["data"]): void {
    this.channel?.post(type, data);
  }

  public on(type: NodeMessage["type"], handler: MessageHandler): () => void {
    const cleanup = this.channel?.on(type, (data) => {
      handler({ type, data });
    });

    return () => {
      cleanup?.();
    };
  }

  public destroy(): void {
    this.controller.destroy();
    this.iframe?.parentNode?.removeChild(this.iframe);
    this.iframe = null;
    idOSIsle.instances.delete(this.containerId);
  }
}
