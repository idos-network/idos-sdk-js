import { idOSClientIdle, type idOSClientLoggedIn, LocalEnclave } from "@idos-network/client";
import { utf8Decode } from "@idos-network/core";
import { createWebKwilClient } from "@idos-network/core/kwil-infra";
import { decrypt, keyDerivation } from "@idos-network/utils/encryption";
import { ChromeExtensionStore } from "@idos-network/utils/store";
import fetchAdapter from "@vespaiach/axios-fetch-adapter";
import Axios from "axios";
import { Wallet } from "ethers";
import nacl from "tweetnacl";

console.log("🚀 idOS background script loaded");

// Simple port manager for persistent connections
class PortManager {
  private ports = new Map<number, chrome.runtime.Port>();
  private idosClient: idOSClientLoggedIn | null = null;
  private keyPair: nacl.box.KeyPair | null = null;

  constructor() {
    this.initIdos();
  }

  private async initIdos() {
    const mnemonic = "lift swear siege over supply crop robust wrist also lava trick dust";
    const wallet = Wallet.fromPhrase(mnemonic);

    console.log("🔑 wallet:", wallet);

    const store = new ChromeExtensionStore();

    try {
      const kwilClient = await createWebKwilClient({
        nodeUrl: "https://nodes.staging.idos.network",
        chainId: "idos-staging",
      });

      // Patch request method for old axios version
      this.patchKwilClient(kwilClient);

      console.log("🔑 client:", kwilClient);

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
      const idOSClient = new idOSClientIdle(store, kwilClient, enclaveProvider);
      console.log("🔑 idOSClient:", idOSClient);

      const idOSClientWithUserSigner = await idOSClient.withUserSigner(wallet);
      console.log("🔑 idOSClientWithUserSigner:", idOSClientWithUserSigner);

      try {
        this.idosClient = await idOSClientWithUserSigner.logIn();
        console.log("🔑 idosClient:", this.idosClient);
      } catch (error) {
        console.error("🔑 error:", error);
      }
    } catch (error) {
      console.error("🔑 error:", error);
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
      case "getCredentials":
        return await this.handleGetCredentials(message.params.level);

      case "getAllCredentials":
        return await this.handleGetAllCredentials();

      case "getCredentialContent":
        return await this.handleGetCredentialContent(message.params.id);

      case "showCredentialsPopup":
        return await this.showCredentialsPopup(
          message.params.level,
          message.params.origin,
          message.params.url,
        );

      default:
        throw new Error(`Unknown message type: ${message.type}`);
    }
  }

  private async handleGetCredentials(level: string) {
    // For now, return mock data - in real implementation, this would show popup
    return {
      level,
      data: {
        name: "John Doe",
        email: "john@example.com",
        age: 25,
        verified: true,
      },
    };
  }

  private async handleGetAllCredentials() {
    if (!this.idosClient) {
      throw new Error("No idOS client found");
    }
    return await this.idosClient.getAllCredentials();
  }

  private async handleGetCredentialContent(id: string) {
    if (!this.idosClient) {
      throw new Error("No idOS client found");
    }
    return await this.idosClient.getCredentialContent(id);
  }

  private async showCredentialsPopup(level: string, origin: string, url: string) {
    const requestId = crypto.randomUUID();

    chrome.windows.create({
      url: `${chrome.runtime.getURL("src/popup/index.html")}?requestId=${requestId}&level=${level}&origin=${encodeURIComponent(origin)}&url=${encodeURIComponent(url)}`,
      type: "popup",
      width: 400,
      height: 600,
      focused: true,
    });

    // Return the requestId so content script can track this request
    return { requestId };
  }

  private async showPasswordPopup(
    userId?: string,
    expectedUserEncryptionPublicKey?: string,
  ): Promise<string> {
    const requestId = crypto.randomUUID();

    chrome.windows.create({
      url: `${chrome.runtime.getURL("src/popup/index.html")}?type=password&requestId=${requestId}&userId=${userId}&expectedUserEncryptionPublicKey=${expectedUserEncryptionPublicKey}`,
      type: "popup",
      width: 650,
      height: 250,
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

  handlePopupResponse(requestId: string, result: any, error?: string) {
    console.log("🔑 handlePopupResponse:", requestId, result, error);
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
  console.log("🔑 popup response:", request);
  if (request.type === "IDOS_POPUP_RESPONSE") {
    const { requestId, result, error } = request.data;
    portManager.handlePopupResponse(requestId, result, error);
    sendResponse({ success: true });
  }
});
