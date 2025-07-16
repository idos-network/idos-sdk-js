import {
  idOSClientIdle,
  type idOSClientLoggedIn,
  type idOSClientWithUserSigner,
  LocalEnclave,
} from "@idos-network/client";
import { utf8Decode } from "@idos-network/core";
import { createWebKwilClient, type KwilActionClient } from "@idos-network/core/kwil-infra";
import { decrypt, keyDerivation } from "@idos-network/utils/encryption";
import { ChromeExtensionStore } from "@idos-network/utils/store";
import fetchAdapter from "@vespaiach/axios-fetch-adapter";
import Axios from "axios";
import { type HDNodeWallet, Wallet } from "ethers";
import nacl from "tweetnacl";

console.log("🚀 idOS background script loaded");

// Simple port manager for persistent connections
class PortManager {
  private ports = new Map<number, chrome.runtime.Port>();
  private idOSClientWithUserSigner: idOSClientWithUserSigner | null = null;
  private idOSLoggedInClient: idOSClientLoggedIn | null = null;
  private keyPair: nacl.box.KeyPair | null = null;
  private wallet: HDNodeWallet | null = null;
  private store: ChromeExtensionStore | null = null;
  private kwilClient: KwilActionClient | null = null;

  constructor() {
    this.initIdos();
  }

  private async initIdos() {
    const mnemonic = "lift swear siege over supply crop robust wrist also lava trick dust";
    this.wallet = Wallet.fromPhrase(mnemonic);

    console.log("🔑 wallet:", this.wallet);

    this.store = new ChromeExtensionStore();

    try {
      this.kwilClient = await createWebKwilClient({
        nodeUrl: "https://nodes.staging.idos.network",
        chainId: "idos-staging",
      });

      // Patch request method for old axios version
      this.patchKwilClient(this.kwilClient);

      console.log("🔑 client:", this.kwilClient);

      const localProvider = {
        reconfigure: () => {},
        getEncryptionPublicKey: async (options: any) => {
          console.log("🔑 getEncryptionPublicKey:", options);
          const password = await this.showPasswordPopup(
            options.storage.userId,
            options.storage.expectedUserEncryptionPublicKey,
          );
          const secretKey = await keyDerivation(password, options.storage.userId);
          this.keyPair = nacl.box.keyPair.fromSecretKey(secretKey);
          return { encryptionPublicKey: this.keyPair.publicKey };
        },
        decrypt: async (message: Uint8Array, senderPublicKey: Uint8Array) => {
          console.log("🔑 decrypt:", message, senderPublicKey);
          return utf8Decode(await decrypt(message, this.keyPair, senderPublicKey));
        },
      };

      const enclaveProvider = new LocalEnclave({ localProvider });
      console.log("🔑 enclaveProvider:", enclaveProvider);

      // @ts-expect-error - TODO: fix this
      const idOSClient = new idOSClientIdle(this.store, this.kwilClient, enclaveProvider);
      console.log("🔑 idOSClient:", idOSClient);

      this.idOSClientWithUserSigner = await idOSClient.withUserSigner(this.wallet);
      console.log("🔑 idOSClientWithUserSigner:", this.idOSClientWithUserSigner);

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

  private patchKwilClient(kwilClient: any) {
    kwilClient.client.request = function () {
      const headers: any = {};

      if (this.cookie) {
        headers.Cookie = this.cookie;
      }

      const instance = Axios.create({
        baseURL: this.config.kwilProvider,
        timeout: this.config.timeout,
        maxContentLength: 1024 * 1024 * 512,
        withCredentials: true,
        adapter: fetchAdapter,
        headers,
      });

      if (this.config.logging) {
        instance.interceptors.request.use((request) => {
          this.config.logger!(`Requesting: ${request.baseURL}${request.url}`);
          return request;
        });

        instance.interceptors.response.use((response) => {
          this.config.logger!(`Response:   ${response.config.url} - ${response.status}`);
          return response;
        });
      }
      return instance;
    };
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

      default:
        throw new Error(`Unknown message type: ${message.type}`);
    }
  }

  private async handleGetAllCredentials() {
    if (!this.idOSLoggedInClient) {
      throw new Error("No idOS client found");
    }
    return await this.idOSLoggedInClient.getAllCredentials();
  }

  private async handleGetCredentialContent(id: string) {
    if (!this.idOSLoggedInClient) {
      throw new Error("No idOS client found");
    }
    return await this.idOSLoggedInClient.getCredentialContent(id);
  }

  private async showPasswordPopup(
    userId?: string,
    expectedUserEncryptionPublicKey?: string,
  ): Promise<string> {
    const requestId = crypto.randomUUID();

    chrome.windows.create({
      url: `${chrome.runtime.getURL("src/popup/index.html")}?type=password&requestId=${requestId}&userId=${userId}&expectedUserEncryptionPublicKey=${expectedUserEncryptionPublicKey}`,
      type: "popup",
      width: 470,
      height: 450,
      focused: true,
    });

    return new Promise((resolve, reject) => {
      // Store the promise resolvers for popup response
      this.pendingPasswordRequests.set(requestId, { resolve, reject });
    });
  }

  // Handle popup responses
  private pendingPasswordRequests = new Map<
    string,
    { resolve: (value: string) => void; reject: (reason: any) => void }
  >();

  handleConfigRequest(requestId: string) {
    chrome.runtime.sendMessage({
      type: "IDOS_POPUP_CONFIG_RESPONSE",
      data: {
        requestId,
        address: this.wallet?.address,
        // @ts-expect-error - TODO: fix this
        network: this.kwilClient?.client.chainId,
        // @ts-expect-error - TODO: fix this
        node: this.kwilClient?.client.config.kwilProvider,
        status: this.idOSLoggedInClient ? "Has profile" : "No profile",
        user: this.idOSLoggedInClient?.user?.id,
      },
    });
  }

  handlePopupMessage(requestId: string, result: any, error?: string) {
    console.log("🔑 popup message:", requestId, result, error);
    if (this.pendingPasswordRequests.has(requestId)) {
      const { resolve, reject } = this.pendingPasswordRequests.get(requestId)!;
      this.pendingPasswordRequests.delete(requestId);

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
