import {
  idOSClientConfiguration,
  type idOSClientLoggedIn,
  type idOSClientWithUserSigner,
} from "@idos-network/client";
import type { AuthMethod } from "@idos-network/utils/enclave";
import { LocalEnclave } from "@idos-network/utils/enclave/local";
import { ChromeExtensionStore } from "@idos-network/utils/store";
import { type HDNodeWallet, Wallet } from "ethers";

console.log("🚀 idOS background script loaded");

// Simple port manager for persistent connections
class PortManager {
  private ports = new Map<number, chrome.runtime.Port>();
  private idOSClientWithUserSigner: idOSClientWithUserSigner | null = null;
  private idOSLoggedInClient: idOSClientLoggedIn | null = null;
  private wallet: HDNodeWallet;
  private store: ChromeExtensionStore;

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

    class LocalWalletEnclave extends LocalEnclave {
      async chooseAuthAndPassword(): Promise<{ authMethod: AuthMethod; password?: string }> {
        return self.showPasswordPopup(
          this.allowedAuthMethods,
          this.userId,
          this.expectedUserEncryptionPublicKey,
        );
      }

      async confirm(message: string): Promise<boolean> {
        return self.showConfirmPopup(message);
      }
    }

    console.log(import.meta.env);

    const configuration = new idOSClientConfiguration<LocalWalletEnclave>({
      nodeUrl: import.meta.env.VITE_IDOS_NODE_URL,
      chainId: import.meta.env.VITE_IDOS_CHAIN_ID,
      store: this.store,
      enclaveOptions: {
        allowedAuthMethods: ["password", "mpc"],
        mpcConfiguration: {
          nodeUrl: import.meta.env.VITE_IDOS_MPC_NODE_URL,
          contractAddress: import.meta.env.VITE_IDOS_MPC_CONTRACT_ADDRESS,
        },
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
  private async handleMessage(message: any) {
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
    allowedAuthMethods: AuthMethod[],
    userId?: string,
    expectedUserEncryptionPublicKey?: string,
  ): Promise<{ authMethod: AuthMethod; password?: string }> {
    const requestId = crypto.randomUUID();

    chrome.windows.create({
      url: `${chrome.runtime.getURL("src/popup/index.html")}?type=password&requestId=${requestId}&userId=${userId}&expectedUserEncryptionPublicKey=${expectedUserEncryptionPublicKey}&allowedAuthMethods=${JSON.stringify(allowedAuthMethods)}`,
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
    { resolve: (value: any) => void; reject: (reason: any) => void }
  >();

  handleConfigRequest(requestId: string) {
    chrome.runtime.sendMessage({
      type: "IDOS_POPUP_CONFIG_RESPONSE",
      data: {
        requestId,
        address: this.wallet?.address,
        // @ts-expect-error - TODO: fix this
        network: this.idOSClientWithUserSigner?.kwilClient.client.chainId,
        // @ts-expect-error - TODO: fix this
        node: this.idOSClientWithUserSigner?.kwilClient.client.config.kwilProvider,
        status: this.idOSLoggedInClient ? "Has profile" : "No profile",
        user: this.idOSLoggedInClient?.user?.id,
      },
    });
  }

  handlePopupMessage(requestId: string, result: any, error?: string) {
    console.log("🔑 popup message:", requestId, result, error);
    if (this.pendingPopupRequests.has(requestId)) {
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
