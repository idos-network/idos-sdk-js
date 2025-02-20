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
  getAccount,
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
  private static wagmiConfig: Config;

  private iframe: HTMLIFrameElement | null = null;
  private containerId: string;
  private controller: Controller;
  private channel: ChannelInstance<IsleControllerMessage, IsleNodeMessage> | null = null;
  private iframeId: string;
  private signer?: JsonRpcSigner;
  private theme?: IsleTheme;

  private static initializeWagmi(): void {
    if (idOSIsle.wagmiConfig) return;

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

  private constructor(options: idOSIsleConstructorOptions) {
    this.containerId = options.container;
    this.theme = options.theme;
    this.iframeId = `iframe-isle-${Math.random().toString(36).slice(2, 9)}`;

    idOSIsle.initializeWagmi();

    this.controller = createController({
      targetOrigin: "https://localhost:5174",
    });

    const container = document.getElementById(this.containerId);
    if (!container) {
      throw new Error(`Element with id "${this.containerId}" not found`);
    }

    // Remove any existing iframe in the container
    const existingIframe = container.querySelector("iframe");
    if (existingIframe) {
      container.removeChild(existingIframe);
    }

    // Create new iframe
    this.iframe = document.createElement("iframe");
    this.iframe.id = this.iframeId;
    this.iframe.src = "https://localhost:5174";
    this.iframe.style.width = "100%";
    this.iframe.style.height = "100%";
    this.iframe.style.border = "none";

    container.appendChild(this.iframe);
    this.setupController();
  }

  private async reconnect(): Promise<void> {
    const account = getAccount(idOSIsle.wagmiConfig);

    if (account.status === "connected") {
      const walletClient = await getWalletClient(idOSIsle.wagmiConfig);
      if (walletClient) {
        const provider = new BrowserProvider(walletClient.transport);
        this.signer = await provider.getSigner();
      }
      return;
    }

    await reconnect(idOSIsle.wagmiConfig);
  }

  private async setupSigner(): Promise<void> {
    const walletClient = await getWalletClient(idOSIsle.wagmiConfig);
    if (walletClient) {
      const provider = new BrowserProvider(walletClient.transport);
      this.signer = await provider.getSigner();
    }
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

    // Initial state is already 'initializing' in the store
    this.channel.on("initialized", async () => {
      const account = getAccount(idOSIsle.wagmiConfig);
      await this.handleAccountChange(account);
    });

    this.channel.post("initialize", {
      theme: this.theme,
    });

    this.channel.on("link-wallet", async () => {
      const account = getAccount(idOSIsle.wagmiConfig);
      const url = `https://dashboard.playground.idos.network/wallets?add-wallet=${account.address}&callbackUrl=${window.location.href}`;
      window.location.href = url;
    });
  }

  private async handleAccountChange(account: {
    status: "disconnected" | "connecting" | "connected" | "reconnecting";
    address?: string;
  }): Promise<void> {
    // Skip intermediate connecting states when we're already connected
    if (account.status === "connecting" && this.signer) {
      return;
    }

    // For connected state, ensure we have a signer
    if (account.status === "connected") {
      await this.setupSigner();
    } else if (account.status === "disconnected") {
      this.signer = undefined;
    }

    // We're no longer initializing once we start getting real states
    this.send("update", {
      connectionStatus: account.status,
      address: account.address,
      status: "no-profile", // This will be replaced with BE query later
    });
  }

  private async watchAccountChanges(): Promise<void> {
    watchAccount(idOSIsle.wagmiConfig, {
      onChange: async (account) => {
        if (this.channel) {
          await this.handleAccountChange(account);
        }
      },
    });
  }

  static initialize(options: idOSIsleConstructorOptions): idOSIsle {
    const instance = new idOSIsle(options);
    // Start these processes but don't wait for them
    instance.reconnect().catch(console.error);
    instance.watchAccountChanges();
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
      await this.handleAccountChange({ status: "connecting" });

      const result = await connect(idOSIsle.wagmiConfig, {
        connector: injected(),
      });

      if (result.accounts.length > 0) {
        const walletClient = await getWalletClient(idOSIsle.wagmiConfig);

        if (!walletClient) {
          await this.handleAccountChange({ status: "disconnected" });
          throw new Error("Failed to get `walletClient` from `wagmiConfig`");
        }

        const provider = new BrowserProvider(walletClient.transport);
        this.signer = await provider.getSigner();
        await this.handleAccountChange({ status: "connected" });
      } else {
        await this.handleAccountChange({ status: "disconnected" });
      }
    } catch (error) {
      await this.handleAccountChange({ status: "disconnected" });
      throw new Error("Failed to connect a wallet to the idOS Isle", { cause: error });
    }
  }

  async getSigner(): Promise<JsonRpcSigner | undefined> {
    return this.signer;
  }

  destroy(): void {
    this.controller.destroy();
    this.iframe?.parentNode?.removeChild(this.iframe);
    this.iframe = null;
  }
}
