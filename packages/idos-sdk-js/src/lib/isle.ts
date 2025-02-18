/* cspell:disable-next-line */
import { type ChannelInstance, type Controller, createController } from "@sanity/comlink";
import {
  http,
  type Config,
  connect,
  createConfig,
  disconnect,
  getAccount,
  getWalletClient,
  injected,
} from "@wagmi/core";
import { mainnet } from "@wagmi/core/chains";
import { BrowserProvider, type JsonRpcSigner } from "ethers";

export type idOSIsleTheme = "light" | "dark";
export type idOSIsleStatus =
  | "disconnected"
  | "no-profile"
  | "not-verified"
  | "pending-verification"
  | "verified"
  | "error";

export type WalletConnectionStatus = "connecting" | "connected" | "disconnected" | "error";

interface idOSIsleConstructorOptions {
  container: string;
  theme?: idOSIsleTheme;
}

type ControllerMessage =
  | {
      type: "initialize";
      data: {
        status: idOSIsleStatus;
        theme?: idOSIsleTheme;
      };
    }
  | {
      type: "update";
      data: {
        theme?: idOSIsleTheme;
        status?: idOSIsleStatus;
      };
    }
  | {
      type: "wallet_state";
      data: {
        status: WalletConnectionStatus;
        address?: string;
        error?: string;
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
    }
  | {
      type: "connect-wallet";
    };

type MessageHandler<T extends NodeMessage["type"]> = (
  message: Extract<NodeMessage, { type: T }>,
) => void;

export class idOSIsle {
  private static instances = new Map<string, idOSIsle>();
  private static wagmiConfig: Config;

  private iframe: HTMLIFrameElement | null = null;
  private containerId: string;
  private controller: Controller;
  private channel: ChannelInstance<ControllerMessage, NodeMessage> | null = null;
  private theme?: idOSIsleTheme;
  private iframeId: string;
  private signer?: JsonRpcSigner;

  private constructor(options: idOSIsleConstructorOptions) {
    this.containerId = options.container;
    this.theme = options.theme;
    this.iframeId = `iframe-isle-${Math.random().toString(36).slice(2, 9)}`;

    // Initialize Wagmi config if not already initialized
    if (!idOSIsle.wagmiConfig) {
      idOSIsle.wagmiConfig = createConfig({
        chains: [mainnet],
        connectors: [injected()],
        transports: {
          [mainnet.id]: http(),
        },
      });
    }

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

    const { status } = getAccount(idOSIsle.wagmiConfig);
    let isleStatus: idOSIsleStatus;

    if (status === "connected") {
      isleStatus = "no-profile";
    } else {
      isleStatus = "disconnected";
    }

    this.channel.start();
    this.channel.post("initialize", {
      theme: this.theme,
      status: isleStatus,
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

  public on<T extends NodeMessage["type"]>(type: T, handler: MessageHandler<T>): () => void {
    const cleanup = this.channel?.on(type, (data) => {
      handler({ type, data } as Extract<NodeMessage, { type: T }>);
    });

    return () => {
      cleanup?.();
    };
  }

  private async updateWalletState(
    status: WalletConnectionStatus,
    address?: string,
    error?: string,
  ): Promise<void> {
    this.channel?.post("wallet_state", {
      status,
      address,
      error,
    });
  }

  public async connectWallet(): Promise<void> {
    try {
      await this.updateWalletState("connecting");
      const result = await connect(idOSIsle.wagmiConfig, {
        connector: injected(),
      });

      if (result.accounts.length > 0) {
        const walletClient = await getWalletClient(idOSIsle.wagmiConfig);
        if (!walletClient) throw new Error("Failed to get wallet client");

        const provider = new BrowserProvider(walletClient.transport);
        this.signer = await provider.getSigner();
        await this.updateWalletState("connected", result.accounts[0]);
      } else {
        await this.updateWalletState("disconnected");
      }
    } catch (error) {
      await this.updateWalletState(
        "error",
        undefined,
        error instanceof Error ? error.message : "Unknown error",
      );
    }
  }

  public async disconnectWallet(): Promise<void> {
    try {
      await disconnect(idOSIsle.wagmiConfig);
      this.signer = undefined;
      await this.updateWalletState("disconnected");
    } catch (error) {
      await this.updateWalletState(
        "error",
        undefined,
        error instanceof Error ? error.message : "Unknown error",
      );
    }
  }

  public async getSigner(): Promise<JsonRpcSigner | undefined> {
    return this.signer;
  }

  public destroy(): void {
    this.controller.destroy();
    this.iframe?.parentNode?.removeChild(this.iframe);
    this.iframe = null;
    idOSIsle.instances.delete(this.containerId);
  }
}
