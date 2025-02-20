import {
  type CreateKwilClientParams,
  type KwilActionClient,
  createNodeKwilClient,
} from "@idos-network/core";
import { hasProfile } from "@idos-network/core/kwil-actions";
/* cspell:disable-next-line */
import { type ChannelInstance, type Controller, createController } from "@sanity/comlink";
import {
  http,
  type Config,
  connect,
  createConfig,
  createStorage,
  disconnect,
  getAccount,
  getWalletClient,
  injected,
  reconnect,
  watchAccount,
} from "@wagmi/core";
import { mainnet, sepolia } from "@wagmi/core/chains";
import { BrowserProvider, type JsonRpcSigner } from "ethers";
import { IframeEnclave } from "./enclave-providers";
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
  kwilOptions: CreateKwilClientParams;
  theme?: idOSIsleTheme;
}

type ControllerMessage =
  | {
      type: "initialize";
      data: {
        theme?: idOSIsleTheme;
        status?: idOSIsleStatus;
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
    }
  | {
      type: "create-key-pair";
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
  private kwilClient?: KwilActionClient | null = null;

  private constructor(options: idOSIsleConstructorOptions) {
    this.containerId = options.container;
    this.theme = options.theme;
    this.iframeId = `iframe-isle-${Math.random().toString(36).slice(2, 9)}`;

    // Initialize Wagmi config if not already initialized
    if (!idOSIsle.wagmiConfig) {
      idOSIsle.wagmiConfig = createConfig({
        storage: createStorage({
          key: "idOS:isle",
          storage: localStorage,
        }),
        chains: [mainnet, sepolia],
        connectors: [injected()],
        transports: {
          [mainnet.id]: http(),
          [sepolia.id]: http(),
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

  private async reconnect(): Promise<void> {
    const account = getAccount(idOSIsle.wagmiConfig);

    if (account.status === "connected") {
      return;
    }

    const accounts = await reconnect(idOSIsle.wagmiConfig);
    if (accounts.length > 0) {
      const walletClient = await getWalletClient(idOSIsle.wagmiConfig);
      if (!walletClient) {
        throw new Error("Failed to get wallet client");
      }
      const provider = new BrowserProvider(walletClient.transport);
      this.signer = await provider.getSigner();
    }
  }

  private async createKwilClient(options: CreateKwilClientParams) {
    try {
      if (!this.signer) return;

      const kwilClient = await createNodeKwilClient(options);
      this.kwilClient = kwilClient;

      const profile = await this.hasProfile();
      this.send("update", { status: profile ? "verified" : "no-profile" });
    } catch (error) {
      console.error({ error });
      this.send("update", { status: "error" });
    }
  }

  async createKeyPair() {
    const iframeProvider = new IframeEnclave({
      container: "#idos",
      mode: "new",
    });
    await iframeProvider.load();
    const userId = crypto.randomUUID();

    const keyPair = await iframeProvider.discoverUserEncryptionPublicKey(userId);
    return keyPair;
  }

  private async hasProfile() {
    if (!this.kwilClient || !this.signer) return;
    return await hasProfile(this.kwilClient, this.signer.address);
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
      status: "disconnected",
    });
  }

  private async watchAccountChanges(): Promise<void> {
    watchAccount(idOSIsle.wagmiConfig, {
      onChange: (account) => {
        if (account.status === "connected" || account.status === "disconnected") {
          this.send("update", { status: account.status });
        }
      },
    });
  }

  static initialize(options: idOSIsleConstructorOptions): idOSIsle {
    const existingInstance = idOSIsle.instances.get(options.container);
    if (existingInstance) {
      return existingInstance;
    }
    const instance = new idOSIsle(options);
    instance.reconnect().then(() => {
      instance.createKwilClient(options.kwilOptions);
    });
    instance.watchAccountChanges();

    return instance;
  }

  send(type: ControllerMessage["type"], data: ControllerMessage["data"]): void {
    this.channel?.post(type, data);
  }

  on<T extends NodeMessage["type"]>(type: T, handler: MessageHandler<T>): () => void {
    const cleanup = this.channel?.on(type, (data) => {
      handler({ type, data } as Extract<NodeMessage, { type: T }>);
    });

    return () => {
      cleanup?.();
    };
  }

  async connect(): Promise<void> {
    try {
      const result = await connect(idOSIsle.wagmiConfig, {
        connector: injected(),
      });

      if (result.accounts.length > 0) {
        const walletClient = await getWalletClient(idOSIsle.wagmiConfig);

        if (!walletClient) {
          throw new Error("Failed to get wallet client");
        }

        const provider = new BrowserProvider(walletClient.transport);
        this.signer = await provider.getSigner();
      } else {
      }
    } catch (error) {}
  }

  async disconnect(): Promise<void> {
    try {
      await disconnect(idOSIsle.wagmiConfig);
      this.signer = undefined;
    } catch (error) {}
  }

  async getSigner(): Promise<JsonRpcSigner | undefined> {
    return this.signer;
  }

  destroy(): void {
    this.controller.destroy();
    this.iframe?.parentNode?.removeChild(this.iframe);
    this.iframe = null;
    idOSIsle.instances.delete(this.containerId);
  }
}
