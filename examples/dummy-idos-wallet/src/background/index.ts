import {
  idOSClientConfiguration,
  type idOSClientLoggedIn,
  type idOSClientWithUserSigner,
} from "@idos-network/client";
import type {
  EncryptionPasswordStore,
  MPCPasswordContext,
  PasswordContext,
} from "@idos-network/utils/enclave";
import { LocalEnclave, type LocalEnclaveOptions } from "@idos-network/utils/enclave/local";
import { ChromeExtensionStore } from "@idos-network/utils/store";
import { type HDNodeWallet, Wallet } from "ethers";

console.log("🚀 idOS background script loaded");

const ENCLAVE_AUTHORIZED_ORIGINS_KEY = "enclave-authorized-origins";

// Simple port manager for persistent connections
class PortManager {
  private ports = new Map<number, chrome.runtime.Port>();
  private idOSClientWithUserSigner: idOSClientWithUserSigner | null = null;
  private idOSLoggedInClient: idOSClientLoggedIn | null = null;
  private wallet: HDNodeWallet;
  private store: ChromeExtensionStore;

  public currentOrigin: string | undefined;

  constructor() {
    // await chrome.storage.local.remove("idOS-encryption-secret-key")
    const mnemonicExisting = "lift swear siege over supply crop robust wrist also lava trick dust";
    // const mnemonicNonExisting = "flush pair armor meadow convince pigeon elbow hurry space news awake shrimp";
    this.wallet = Wallet.fromPhrase(mnemonicExisting);
    console.log("🔑 wallet:", this.wallet);

    this.store = new ChromeExtensionStore();
    console.log("🔑 store:", this.store);

    this.initIdos();
  }

  private async initIdos() {
    // Reference to this klass
    const self = this;

    class LocalWalletEnclave extends LocalEnclave<LocalEnclaveOptions> {
      private authorizedOrigins: string[] = [];

      async load(): Promise<void> {
        await super.load();

        this.authorizedOrigins = JSON.parse(
          (await this.store.get<string>(ENCLAVE_AUTHORIZED_ORIGINS_KEY)) ?? "[]",
        );
      }

      /** @see LocalEnclave#reset */
      async reset(): Promise<void> {
        await super.reset();

        this.authorizedOrigins = [];
      }

      async getPasswordContext(): Promise<PasswordContext | MPCPasswordContext> {
        const res = await self.showPasswordPopup(
          this.options.allowedEncryptionStores ?? ["user"],
          this.userId,
          this.options.expectedUserEncryptionPublicKey,
        );

        await this.acceptParentOrigin();

        return res;
      }

      async guardKeys(): Promise<boolean> {
        if (!self.currentOrigin || this.authorizedOrigins.includes(self.currentOrigin)) {
          return true;
        }

        const confirmation = await this.confirm(
          `Do you want to authorize '${self.currentOrigin}' to use the keys?`,
        );

        if (!confirmation) {
          return false;
        }

        await this.acceptParentOrigin();

        return true;
      }

      async acceptParentOrigin(): Promise<void> {
        if (!self.currentOrigin) {
          return;
        }

        this.authorizedOrigins = [...new Set([...this.authorizedOrigins, self.currentOrigin])];

        await this.store.set(
          ENCLAVE_AUTHORIZED_ORIGINS_KEY,
          JSON.stringify(this.authorizedOrigins),
        );
      }

      async confirm(message: string): Promise<boolean> {
        return self.showConfirmPopup(message);
      }
    }

    const configuration = new idOSClientConfiguration<LocalWalletEnclave>({
      nodeUrl: import.meta.env.VITE_IDOS_NODE_URL,
      chainId: import.meta.env.VITE_IDOS_CHAIN_ID,
      store: this.store,
      enclaveOptions: {
        allowedEncryptionStores: ["user", "mpc"],
      },
      enclaveProvider: LocalWalletEnclave,
    });

    const idOSClient = await configuration.createClient();
    console.log("🔑 idOSClient:", idOSClient);

    this.idOSClientWithUserSigner = await idOSClient.withUserSigner(this.wallet);
    console.log("🔑 idOSClientWithUserSigner:", this.idOSClientWithUserSigner);

    // await idOSClient.enclaveProvider.reset();

    try {
      this.tryLogIn();
    } catch (error) {
      console.error("🔑 error:", error);
    }
  }

  private async tryLogIn() {
    try {
      if (!this.idOSClientWithUserSigner) {
        throw new Error("No idOS client found");
      }

      this.idOSLoggedInClient = await this.idOSClientWithUserSigner.logIn();
      console.log("🔑 idOSLoggedInClient:", this.idOSLoggedInClient);
    } catch (error) {
      console.error("🔑 error in login:", error);
    }
  }

  private isLoggedIn() {
    return this.idOSLoggedInClient !== null;
  }

  // Handle port connections
  handlePortConnection(port: chrome.runtime.Port) {
    const tabId = port.sender?.tab?.id;
    if (!tabId) {
      port.disconnect();
      return;
    }

    this.ports.set(tabId, port);
    console.log(`🔗 Port connected for tab ${tabId}`);

    // Handle messages from content script
    port.onMessage.addListener(async (message) => {
      if (message.data?.includes("ping")) {
        return { data: "pong" };
      }

      if (message.type === "connected") {
        return { data: "ok" };
      }

      console.log("📨 Received message:", message);

      try {
        const result = await this.handleMessage(message);
        port.postMessage({ id: message.id, result });
      } catch (error) {
        console.error("🔑 error parsing message:", error);
        port.postMessage({
          id: message.id,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    });

    // Clean up when port disconnects
    port.onDisconnect.addListener(() => {
      this.ports.delete(tabId);
      console.log(`🔗 Port disconnected for tab ${tabId}`);
    });
  }

  // Handle different message types
  private async handleMessage(message: {
    id: string;
    type: string;
    params: {
      id: string;
      // biome-ignore lint/suspicious/noExplicitAny: any is fine here
      message: any;
      url: string;
      origin: string;
    };
  }) {
    // Set current origin to handle guardKeys
    this.currentOrigin = message.params.origin;

    switch (message.type) {
      case "getAllCredentials":
        return await this.handleGetAllCredentials();

      case "getCredentialContent":
        return await this.handleGetCredentialContent(message.params.id);

      case "confirm":
        return await this.handleConfirm(message.params.message);

      default:
        throw new Error(`Unknown message type: ${message.type}`);
    }
  }

  private async handleConfirm(message: string) {
    console.log("🔑 confirm message:", message);
    return await this.idOSLoggedInClient?.enclaveProvider.confirm(message);
  }

  private async handleGetAllCredentials() {
    if (!this.isLoggedIn()) {
      this.openLoginPage();
      throw new Error("Not logged in - login page opened");
    }

    return await this.idOSLoggedInClient?.getAllCredentials();
  }

  private async handleGetCredentialContent(id: string) {
    if (!this.isLoggedIn()) {
      this.openLoginPage();
      throw new Error("Not logged in - login page opened");
    }

    return await this.idOSLoggedInClient?.getCredentialContent(id);
  }

  private async openLoginPage() {
    console.log("🔑 Opening login page...");

    // Create a new tab with the login page
    const loginUrl = chrome.runtime.getURL("src/popup/index.html?type=login");

    try {
      await chrome.tabs.create({
        url: loginUrl,
        active: true,
      });
    } catch (error) {
      console.error("🔑 Failed to open login page:", error);
    }
  }

  private async showPasswordPopup(
    allowedEncryptionStores: EncryptionPasswordStore[],
    userId?: string,
    expectedUserEncryptionPublicKey?: string,
  ): Promise<PasswordContext | MPCPasswordContext> {
    const requestId = crypto.randomUUID();

    chrome.windows.create({
      url: `${chrome.runtime.getURL("src/popup/index.html")}?type=password&requestId=${requestId}&userId=${userId}&expectedUserEncryptionPublicKey=${expectedUserEncryptionPublicKey}&allowedEncryptionStores=${JSON.stringify(allowedEncryptionStores)}`,
      type: "popup",
      width: 470,
      height: 450,
      focused: true,
    });

    return new Promise((resolve, reject) => {
      // Store the promise resolvers for popup response
      this.pendingPopupRequests.set(requestId, { resolve, reject });
    });
  }

  private async showConfirmPopup(message: string): Promise<boolean> {
    const requestId = crypto.randomUUID();

    chrome.windows.create({
      url: `${chrome.runtime.getURL("src/popup/index.html")}?type=confirm&requestId=${requestId}&message=${encodeURIComponent(message)}`,
      type: "popup",
      width: 470,
      height: 350,
      focused: true,
    });

    return new Promise((resolve, reject) => {
      // Store the promise resolvers for popup response
      this.pendingPopupRequests.set(requestId, { resolve, reject });
    });
  }

  // Handle popup responses
  private pendingPopupRequests = new Map<
    string,
    // biome-ignore lint/suspicious/noExplicitAny: any is fine here
    { resolve: (value: any) => void; reject: (reason: any) => void }
  >();

  handleConfigRequest(requestId: string) {
    chrome.runtime.sendMessage({
      type: "IDOS_POPUP_CONFIG_RESPONSE",
      data: {
        requestId,
        address: this.wallet?.address,
        // @ts-expect-error - chainId exists
        network: this.idOSClientWithUserSigner?.kwilClient.client.chainId,
        // @ts-expect-error - config exists
        node: this.idOSClientWithUserSigner?.kwilClient.client.config.kwilProvider,
        status: this.idOSLoggedInClient ? "Has profile" : "No profile",
        user: this.idOSLoggedInClient?.user?.id,
      },
    });
  }

  // biome-ignore lint/suspicious/noExplicitAny: any is fine here
  handlePopupMessage(requestId: string, result: any, error?: string) {
    console.log("🔑 popup message:", requestId, result, error);
    if (this.pendingPopupRequests.has(requestId)) {
      // biome-ignore lint/style/noNonNullAssertion: By design
      const { resolve, reject } = this.pendingPopupRequests.get(requestId)!;
      this.pendingPopupRequests.delete(requestId);

      if (error) {
        reject(new Error(error));
      } else {
        resolve(result);
      }
    }
  }

  // Send message to specific tab
  // biome-ignore lint/suspicious/noExplicitAny: any is fine here
  sendToTab(tabId: number, message: any) {
    const port = this.ports.get(tabId);
    if (port) {
      port.postMessage(message);
    }
  }
}

// Initialize port manager
const portManager = new PortManager();

// Handle port connections
chrome.runtime.onConnect.addListener((port) => {
  portManager.handlePortConnection(port);
});

// Handle popup responses
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  console.log("🔑 popup message:", request);
  if (request.type === "IDOS_POPUP_CONFIG") {
    portManager.handleConfigRequest(request.data.requestId);
    sendResponse({ success: true });
  }

  if (request.type === "IDOS_POPUP_RESPONSE") {
    const { requestId, result, error } = request.data;
    portManager.handlePopupMessage(requestId, result, error);
    sendResponse({ success: true });
  }
});
