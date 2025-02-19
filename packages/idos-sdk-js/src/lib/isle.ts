/* cspell:disable-next-line */
import type {
  IsleControllerMessage,
  IsleMessageHandler,
  IsleNodeMessage,
  IsleTheme,
} from "@idos-network/core";
import { type ChannelInstance, type Controller, createController } from "@sanity/comlink";
import {
  http,
  type Config,
  connect,
  createConfig,
  createStorage,
  disconnect,
  getAccount,
  getConnections,
  getWalletClient,
  injected,
  reconnect,
  watchAccount,
} from "@wagmi/core";
import { mainnet, sepolia } from "@wagmi/core/chains";
import { BrowserProvider, type JsonRpcSigner } from "ethers";

interface idOSIsleConstructorOptions {
  container: string;
  theme?: IsleTheme;
}

export class idOSIsle {
  private static instances = new Map<string, idOSIsle>();
  private static wagmiConfig: Config;

  private iframe: HTMLIFrameElement | null = null;
  private containerId: string;
  private controller: Controller;
  private channel: ChannelInstance<IsleControllerMessage, IsleNodeMessage> | null = null;
  private iframeId: string;
  private signer?: JsonRpcSigner;
  private theme?: IsleTheme;

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

    await reconnect(idOSIsle.wagmiConfig);
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

  private async watchAccountChanges(): Promise<void> {
    watchAccount(idOSIsle.wagmiConfig, {
      onChange: (account) => {
        this.send("update", { status: account.status });
      },
    });
  }

  static initialize(options: idOSIsleConstructorOptions): idOSIsle {
    const existingInstance = idOSIsle.instances.get(options.container);
    if (existingInstance) {
      return existingInstance;
    }
    const instance = new idOSIsle(options);
    instance.reconnect();
    instance.watchAccountChanges();

    instance.on("disconnect-wallet", async () => {
      await instance.disconnect();
    });

    return instance;
  }

  send(type: IsleControllerMessage["type"], data: IsleControllerMessage["data"]): void {
    this.channel?.post(type, data);
  }

  on<T extends IsleNodeMessage["type"]>(type: T, handler: IsleMessageHandler<T>): () => void {
    const cleanup = this.channel?.on(type, (data) => {
      handler({ type, data } as Extract<IsleNodeMessage, { type: T }>);
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
          throw new Error("Failed to get `walletClient` from `wagmiConfig`");
        }

        const provider = new BrowserProvider(walletClient.transport);
        this.signer = await provider.getSigner();
      }
    } catch (error) {
      throw new Error("Failed to connect a wallet to the idOS Isle", { cause: error });
    }
  }

  async disconnect(): Promise<void> {
    try {
      const { connector } = getConnections(idOSIsle.wagmiConfig)[0];
      await disconnect(idOSIsle.wagmiConfig, {
        connector,
      });
      this.signer = undefined;
    } catch (error) {
      throw new Error("Failed to disconnect from the idOS Isle", { cause: error });
    }
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
