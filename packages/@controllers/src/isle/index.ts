/* cspell:disable-next-line */
import {
  type DelegatedWriteGrantSignatureRequest,
  type IsleControllerMessage,
  type IsleMessageHandler,
  type IsleNodeMessage,
  type IsleTheme,
  type KwilActionClient,
  createKwilSigner,
  createWebKwilClient,
  getAllCredentials,
  hasProfile,
  requestDWGSignature,
  revokeAccessGrant,
} from "@idos-network/core";
import { type ChannelInstance, type Controller, createController } from "@sanity/comlink";
import {
  http,
  type Config,
  createConfig,
  createStorage,
  getAccount,
  getWalletClient,
  injected,
  reconnect,
  signMessage,
  connect as wagmiConnect,
  watchAccount,
} from "@wagmi/core";
import { mainnet, sepolia } from "@wagmi/core/chains";
import { BrowserProvider, type JsonRpcSigner } from "ethers";
import { goTry } from "go-try";
import invariant from "tiny-invariant";

/**
 * Configuration options for creating an idOS Isle instance
 * @interface IdOSIsleOptions
 */
interface idOSIsleControllerOptions {
  /** The ID of the container element where the Isle iframe will be mounted */
  container: string;
  /** Optional theme configuration for the Isle UI */
  theme?: IsleTheme;

  /**
   * Information about the credential requirements for the app
   * This information is used to filter and display `AGs` / `Credentials` in the UI.
   */
  credentialRequirements: {
    /** Information about issuers known to the app */
    acceptedIssuers: {
      url: string;
      name: string;
      logo: string;
      authPublicKey: string;
      credentialType: string[];
    }[];
    /** Information about consumers known to the app */
    integratedConsumers: string[];
    /** The type of credential accepted by the app */
    acceptedCredentialType: string;
  };
}

/**
 * Options for requesting a delegated write grant or an access grant
 * @interface RequestDelegatedWriteGrantOptions
 */
interface RequestPermissionOptions {
  /** The grantee information */
  grantee: {
    /** The public key of the grantee */
    granteePublicKey: string;
    /** Meta information about the grantee */
    meta: {
      url: string;
      name: string;
      logo: string;
    };
  };
  KYCPermissions: string[];
}

/**
 * Public interface for interacting with an idOS Isle instance
 * @interface idOSIsleInstance
 */
interface idOSIsleController {
  /** Initiates a wallet connection process */
  connect: () => Promise<void>;
  /** Retrieves the current signer instance if available */
  getSigner: () => Promise<JsonRpcSigner | undefined>;
  /** Cleans up and removes the Isle instance */
  destroy: () => void;
  /** Sends a message to the Isle iframe */
  send: (type: IsleControllerMessage["type"], data: IsleControllerMessage["data"]) => void;
  /** Subscribes to messages from the Isle iframe */
  on: <T extends IsleNodeMessage["type"]>(type: T, handler: IsleMessageHandler<T>) => () => void;
  /** Requests a delegated write grant for the given grantee */
  requestDelegatedWriteGrant: (
    options: RequestPermissionOptions,
  ) => Promise<{ signature: string; writeGrant: DelegatedWriteGrantSignatureRequest } | undefined>;
  /** Requests an access grant for the given grantee */
  requestPermission: (options: RequestPermissionOptions) => Promise<void>;
  /** Revokes an access grant for the given id */
  revokePermission: (id: string) => Promise<unknown>;
}

// Singleton wagmi config instance shared across all Isle instances
let wagmiConfig: Config;

/**
 * Initializes the wagmi configuration if it hasn't been initialized yet.
 * This is a singleton to ensure we only have one wagmi instance across the application.
 */
const initializeWagmi = (): void => {
  if (wagmiConfig) return;

  wagmiConfig = createConfig({
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
};

/**
 * Creates a new idOS Isle instance.
 * This factory function sets up an iframe-based communication channel with the Isle UI
 * and manages wallet connections and message passing.
 *
 * @param options - Configuration options for the Isle instance
 * @returns An interface for interacting with the Isle instance
 *
 * @example
 * ```typescript
 * const isle = createIsle({ container: "my-container" });
 * await isle.connect(); // Connect a wallet
 * const signer = await isle.getSigner(); // Get the connected signer
 * ```
 */
export const createIsleController = (options: idOSIsleControllerOptions): idOSIsleController => {
  // Internal state
  let iframe: HTMLIFrameElement | null = null;
  const controller: Controller = createController({
    targetOrigin: "https://localhost:5174",
  });
  let channel: ChannelInstance<IsleControllerMessage, IsleNodeMessage> | null = null;
  let signer: JsonRpcSigner | undefined;
  let kwilClient: KwilActionClient | undefined;
  const iframeId = `iframe-isle-${Math.random().toString(36).slice(2, 9)}`;
  const { containerId, theme } = { containerId: options.container, theme: options.theme };

  /**
   * Sets up a new signer instance using the current wallet client
   */
  const setupSigner = async (): Promise<void> => {
    const walletClient = await getWalletClient(wagmiConfig);
    if (walletClient) {
      const provider = new BrowserProvider(walletClient.transport);
      signer = await provider.getSigner();
    }
  };

  /**
   * Handles changes in the wallet connection status
   * Updates the signer and notifies the Isle UI of the change
   */
  const handleAccountChange = async (account: {
    status: "disconnected" | "connecting" | "connected" | "reconnecting";
    address?: string;
  }): Promise<void> => {
    if (account.status === "connecting" && signer) {
      return;
    }

    if (account.status === "connected") {
      await setupSigner();
    } else if (account.status === "disconnected") {
      signer = undefined;
    }

    send("update", {
      connectionStatus: account.status,
      address: account.address,
    });
  };

  const requestDelegatedWriteGrant = async (
    options: RequestPermissionOptions,
  ): Promise<
    { signature: string; writeGrant: DelegatedWriteGrantSignatureRequest } | undefined
  > => {
    invariant(kwilClient, "No `KwilActionClient` found");
    const { address } = getAccount(wagmiConfig);
    const currentTimestamp = Date.now();
    const currentDate = new Date(currentTimestamp);
    const notUsableAfter = new Date(currentTimestamp + 24 * 60 * 60 * 1000);

    const delegatedWriteGrant = {
      id: crypto.randomUUID(),
      owner_wallet_identifier: address as string,
      grantee_wallet_identifier: options.grantee.granteePublicKey,
      issuer_public_key: options.grantee.granteePublicKey,
      access_grant_timelock: currentDate.toISOString().replace(/.\d+Z$/g, "Z"),
      not_usable_before: currentDate.toISOString().replace(/.\d+Z$/g, "Z"),
      not_usable_after: notUsableAfter.toISOString().replace(/.\d+Z$/g, "Z"),
    };

    send("update-create-dwg-status", {
      status: "start-verification",
      meta: {
        url: options.grantee.meta.url,
        name: options.grantee.meta.name,
        logo: options.grantee.meta.logo,
        KYCPermissions: options.KYCPermissions,
      },
    });

    const message: string = await requestDWGSignature(kwilClient, delegatedWriteGrant);

    const [error, signature] = await goTry(() => signMessage(wagmiConfig, { message }));

    if (error) {
      send("update-create-dwg-status", {
        status: "error",
      });

      return;
    }

    send("update-create-dwg-status", {
      status: "success",
    });

    return { signature, writeGrant: delegatedWriteGrant };
  };

  /**
   * Requests an access grant for the given grantee
   */
  const requestPermission = async (options: RequestPermissionOptions): Promise<void> => {
    invariant(kwilClient, "No `KwilActionClient` found");

    send("update-request-access-grant-status", {
      status: "request-permission",
      grantee: options.grantee,
      KYCPermissions: options.KYCPermissions,
    });

    // @todo: implement the request permission logic.
  };

  /**
   * Revokes an access grant for the given id
   */
  const revokePermission = async (id: string): Promise<unknown> => {
    invariant(kwilClient, "No `KwilActionClient` found");
    send("update-revoke-access-grant-status", {
      status: "pending",
    });

    const [error, result] = await goTry(() => {
      invariant(kwilClient, "No `KwilActionClient` found");
      return revokeAccessGrant(kwilClient, id);
    });

    if (error) {
      send("update-revoke-access-grant-status", {
        status: "error",
      });

      return;
    }

    send("update-revoke-access-grant-status", {
      status: "success",
    });

    return result;
  };

  /**
   * Sets up the communication channel with the Isle iframe
   * Initializes message handlers and establishes the connection
   */
  const setupController = (): void => {
    if (!iframe?.contentWindow) return;

    controller.addTarget(iframe.contentWindow);

    channel = controller.createChannel({
      connectTo: "iframe",
      heartbeat: true,
      name: "window",
    });

    // Handle initialization completion
    channel.on("initialized", async () => {
      const account = getAccount(wagmiConfig);
      await handleAccountChange(account);

      if (!signer) {
        throw new Error("No signer found");
      }

      kwilClient = await createWebKwilClient({
        // @todo: make the domain environment aware.
        nodeUrl: "https://nodes.playground.idos.network",
      });

      const [kwilSigner] = createKwilSigner(signer);

      kwilClient.setSigner(kwilSigner);

      // Check if the user has a profile and update the isle status accordingly.
      const _hasProfile = await hasProfile(kwilClient, account.address as string);

      if (!_hasProfile) {
        send("update", {
          status: "no-profile",
        });
        return;
      }

      const credentials = await getAllCredentials(kwilClient);
      const originalCredentials = credentials.filter((cred) => !cred.original_id);

      const matchingCredentials = originalCredentials.filter((cred) => {
        const publicNotes = JSON.parse(cred.public_notes ?? "{}");
        return options.credentialRequirements.acceptedIssuers?.some(
          (issuer) =>
            issuer.authPublicKey === cred.issuer_auth_public_key &&
            issuer.credentialType.includes(publicNotes.type),
        );
      });

      if (matchingCredentials.length === 0) {
        send("update", {
          status: "not-verified",
        });

        return;
      }

      /**
       * @todo: this is not accurate at the moment.
       */
      if (
        matchingCredentials.every((cred) => {
          const publicNotes = JSON.parse(cred.public_notes ?? "{}");
          // @todo: check for 'pending' status properly. Currently we let it fall through.
          return publicNotes.status === "";
        })
      ) {
        send("update", {
          status: "pending-verification",
        });

        return;
      }

      // @todo: implement logic for filtering out `idOSCredentials` and AG's based on the `credentialRequirements`.
      const accessGrants = new Map();
      accessGrants.set(
        {
          granteePublicKey: "0x123",
          meta: {
            name: "Random Grantee",
            logo: "https://avatars.githubusercontent.com/u/4081301?v=4",
          },
        },
        [
          {
            id: crypto.randomUUID(),
            dataId: crypto.randomUUID(),
            type: "KYC Data",
          },
          {
            id: crypto.randomUUID(),
            dataId: crypto.randomUUID(),
            type: "KYC Data (2)",
          },
        ],
      );

      accessGrants.set(
        {
          granteePublicKey: "0x456",
          meta: {
            name: "Random Grantee 2",
            logo: "https://avatars.githubusercontent.com/u/4081302?v=4",
          },
        },
        [],
      );

      send("update", {
        status: "verified",
        accessGrants,
      });
    });

    // Send initial configuration
    channel.post("initialize", {
      theme,
    });

    // Handle wallet linking requests
    // @todo: make the domain environment aware.
    channel.on("link-wallet", async () => {
      const account = getAccount(wagmiConfig);
      const url = `https://dashboard.playground.idos.network/wallets?add-wallet=${account.address}&callbackUrl=${window.location.href}`;
      window.location.href = url;
    });

    channel.start();
  };

  /**
   * Attempts to reconnect to a previously connected wallet
   */
  const reconnectWallet = async (): Promise<void> => {
    const account = getAccount(wagmiConfig);

    if (account.status === "connected") {
      const walletClient = await getWalletClient(wagmiConfig);
      if (walletClient) {
        const provider = new BrowserProvider(walletClient.transport);
        signer = await provider.getSigner();
      }
      return;
    }

    await reconnect(wagmiConfig);
  };

  /**
   * Sets up a subscription to wallet account changes
   */
  const watchAccountChanges = async (): Promise<void> => {
    watchAccount(wagmiConfig, {
      onChange: async (account) => {
        if (channel) {
          await handleAccountChange(account);
        }
      },
    });
  };

  // Initialize the idOSIsle instance
  initializeWagmi();

  const container = document.getElementById(containerId);
  if (!container) {
    throw new Error(`Element with id "${containerId}" not found`);
  }

  // Clean up any existing iframe
  const existingIframe = container.querySelector("iframe");
  if (existingIframe) {
    container.removeChild(existingIframe);
  }

  // Create and mount the idOSIsle iframe
  iframe = document.createElement("iframe");
  iframe.id = iframeId;
  // @todo: make the domain environment aware.
  iframe.src = "https://localhost:5174";
  iframe.style.width = "100%";
  iframe.style.height = "100%";
  iframe.style.border = "none";

  container.appendChild(iframe);
  setupController();

  // Start initialization processes
  reconnectWallet().catch(console.error);
  watchAccountChanges();

  // Public API implementation
  /**
   * Sends a message to the Isle iframe
   */
  const send = (type: IsleControllerMessage["type"], data: IsleControllerMessage["data"]): void => {
    channel?.post(type, data);
  };

  /**
   * Subscribes to messages from the Isle iframe
   * @returns A cleanup function to remove the subscription
   */
  const on = <T extends IsleNodeMessage["type"]>(
    type: T,
    handler: IsleMessageHandler<T>,
  ): (() => void) => {
    const cleanup = channel?.on(type, (data) => {
      handler({ type, data } as unknown as Extract<IsleNodeMessage, { type: T }>);
    });

    return () => {
      cleanup?.();
    };
  };

  /**
   * Initiates a wallet connection process
   * @throws {Error} If the connection fails
   */
  const connect = async (): Promise<void> => {
    try {
      await handleAccountChange({ status: "connecting" });

      const result = await wagmiConnect(wagmiConfig, {
        connector: injected(),
      });

      if (result?.accounts?.length > 0) {
        const walletClient = await getWalletClient(wagmiConfig);

        if (!walletClient) {
          await handleAccountChange({ status: "disconnected" });
          throw new Error("Failed to get `walletClient` from `wagmiConfig`");
        }

        const provider = new BrowserProvider(walletClient.transport);
        signer = await provider.getSigner();
        await handleAccountChange({ status: "connected" });
      } else {
        await handleAccountChange({ status: "disconnected" });
      }
    } catch (error) {
      await handleAccountChange({ status: "disconnected" });
      throw new Error("Failed to connect a wallet to the idOS Isle", { cause: error });
    }
  };

  /**
   * Returns the current signer instance if available
   */
  const getSigner = async (): Promise<JsonRpcSigner | undefined> => {
    return signer;
  };

  /**
   * Cleans up the Isle instance, removing the iframe and destroying the controller
   */
  const destroy = (): void => {
    controller.destroy();
    iframe?.parentNode?.removeChild(iframe);
    iframe = null;
  };

  // Return the public interface
  return {
    connect,
    getSigner,
    destroy,
    send,
    on,
    requestDelegatedWriteGrant,
    requestPermission,
    revokePermission,
  };
};
