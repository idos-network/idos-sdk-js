import {
  type EnclaveOptions,
  IframeEnclave,
  type IsleControllerMessage,
  type IsleMessageHandler,
  type IsleNodeMessage,
  type IsleStatus,
  type IsleTheme,
  type KwilActionClient,
  Store,
  base64Decode,
  base64Encode,
  buildInsertableIDOSCredential,
  createClientKwilSigner,
  createWebKwilClient,
  type idOSCredential,
  type idOSUser,
  utf8Decode,
  utf8Encode,
} from "@idos-network/core";
import {
  type DelegatedWriteGrantSignatureRequest,
  getUserProfile as _getUserProfile,
  shareCredential as _shareCredential,
  getAccessGrantsOwned,
  getAllCredentials,
  getCredentialById,
  getCredentialOwned,
  hasProfile,
  removeCredential,
  requestDWGMessage,
} from "@idos-network/core/kwil-actions";
import type { KwilSigner } from "@kwilteam/kwil-js";
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
 * Meta information about an actor.
 */
type Meta = {
  url: string;
  name: string;
  logo: string;
};

/**
 * Configuration options for creating an idOS Isle instance
 * @interface IdOSIsleOptions
 */
interface idOSIsleControllerOptions {
  /** The ID of the container element where the Isle iframe will be mounted */
  container: string;

  /** Optional theme configuration for the Isle UI */
  theme?: IsleTheme;

  /** enclave options */
  enclaveOptions: EnclaveOptions;

  /**
   * The issuer configuration.
   */
  issuerConfig: {
    meta: Meta;
    encryptionPublicKey: string;
  };

  /**
   * Information about the credential requirements for the app
   * This information is used to filter and display `AGs` / `Credentials` in the UI.
   */
  credentialRequirements: {
    /** Information about issuers known to the app */
    acceptedIssuers: {
      meta: Meta;
      authPublicKey: string;
    }[];

    /** Information about consumers known to the app */
    integratedConsumers: {
      meta: Meta;
      consumerAuthPublicKey: string;
    }[];

    /** The type of credential accepted by the app */
    acceptedCredentialType: string;
  };
}

/**
 * Options for requesting a delegated write grant or an access grant
 * @interface RequestDelegatedWriteGrantOptions
 */
interface RequestPermissionOptions {
  /** The consumer information */
  consumer: {
    /** The public key of the consumer */
    consumerAuthPublicKey: string;
    /** Meta information about the consumer */
    meta: Meta;
  };
  KYCPermissions: string[];
}

/**
 * Public interface for interacting with an idOS Isle instance
 * @interface idOSIsleInstance
 */
export interface idOSIsleController {
  /** Initiates a wallet connection process */
  connect: () => Promise<void>;
  /** Cleans up and removes the Isle instance */
  destroy: () => void;
  /** Sends a message to the Isle iframe */
  send: (type: IsleControllerMessage["type"], data: IsleControllerMessage["data"]) => void;
  /** Requests a `delegated write grant` for the given `consumer` */
  requestDelegatedWriteGrant: (
    options: RequestPermissionOptions,
  ) => Promise<{ signature: string; writeGrant: DelegatedWriteGrantSignatureRequest } | undefined>;
  /** Requests an access grant for the given `consumer` */
  requestPermission: (options: RequestPermissionOptions) => Promise<void>;
  /** Revokes an access grant for the given `id` */
  revokePermission: (id: string) => Promise<unknown>;
  /** View credential details for the given `id` */
  viewCredentialDetails: (id: string) => Promise<void>;
  /** Toggle ISLE animation (expand/collapse) */
  toggleAnimation: ({ expanded, noDismiss }: { expanded: boolean; noDismiss?: boolean }) => void;

  /** Update the status of the idOS Isle instance */
  updateIsleStatus: (status: IsleStatus) => void;
  /** Subscribe to node messages */
  onIsleMessage: (handler: (message: IsleNodeMessage) => void) => () => void;
  /** Subscribe to the status of the idOS Isle instance */
  onIsleStatusChange: (handler: (status: IsleStatus) => void) => () => void;
  // 🔨
  buildIssuerClientConfig: () => Promise<IssuerClientConfig | null>;
}

// 🔨
type IssuerClientConfig = {
  store: Store;
  kwilClient: KwilActionClient;
  enclaveProvider: IframeEnclave;
  signer: KwilSigner;
  userAddress: string;
};

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
  let enclaveProvider: IframeEnclave | null = null;
  const controller: Controller = createController({
    targetOrigin: "https://isle.idos.network",
  });
  let channel: ChannelInstance<IsleControllerMessage, IsleNodeMessage> | null = null;
  let signer: JsonRpcSigner | undefined;
  let kwilSigner: KwilSigner | undefined;
  let kwilClient: KwilActionClient | undefined;
  const iframeId = `iframe-isle-${Math.random().toString(36).slice(2, 9)}`;
  const { containerId, theme } = { containerId: options.container, theme: options.theme };
  let ownerOriginalCredentials: idOSCredential[] = [];
  const store = new Store(window.localStorage);

  const ensureKwilClient = async (): Promise<KwilActionClient> => {
    if (kwilClient) return kwilClient;

    if (!signer) {
      throw new Error("Cannot initialize KwilClient: No signer available");
    }

    const client = await createWebKwilClient({
      nodeUrl: "https://nodes.playground.idos.network",
    });

    if (!kwilSigner) {
      kwilSigner = (await createClientKwilSigner(store, client, signer))[0];
    }
    client.setSigner(kwilSigner);

    kwilClient = client;
    return client;
  };

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

  const setupEnclave = async (): Promise<void> => {
    if (enclaveProvider) return;
    try {
      const enclaveInstance = new IframeEnclave(options.enclaveOptions);
      await enclaveInstance.load();
      enclaveProvider = enclaveInstance;
    } catch (error) {
      console.error(error);
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
      try {
        await setupSigner();
        if (!signer) {
          throw new Error("Failed to setup signer");
        }
        await setupEnclave();
        if (!enclaveProvider) {
          throw new Error("Failed to setup enclave");
        }
      } catch (error) {
        console.error("Failed to initialize:", error);
        send("update", {
          status: "error",
        });
        return;
      }
    } else if (account.status === "disconnected") {
      signer = undefined;
      enclaveProvider = null;
    }

    send("update", {
      address: account.address,
    });
  };

  const requestDelegatedWriteGrant = async (
    options: RequestPermissionOptions,
  ): Promise<
    { signature: string; writeGrant: DelegatedWriteGrantSignatureRequest } | undefined
  > => {
    try {
      // Ensure client is initialized before any UI operations
      const client = await ensureKwilClient();

      send("update", {
        status: "pending-permissions",
      });

      toggleAnimation({
        expanded: true,
        noDismiss: true,
      });

      send("update-create-dwg-status", {
        status: "start-verification",
        meta: {
          url: options.consumer.meta.url,
          name: options.consumer.meta.name,
          logo: options.consumer.meta.logo,
          KYCPermissions: options.KYCPermissions,
        },
      });

      const { address } = getAccount(wagmiConfig);
      const currentTimestamp = Date.now();
      const currentDate = new Date(currentTimestamp);
      const notUsableAfter = new Date(currentTimestamp + 24 * 60 * 60 * 1000);

      const delegatedWriteGrant = {
        id: crypto.randomUUID(),
        owner_wallet_identifier: address as string,
        grantee_wallet_identifier: options.consumer.consumerAuthPublicKey,
        issuer_public_key: options.consumer.consumerAuthPublicKey,
        access_grant_timelock: currentDate.toISOString().replace(/.\d+Z$/g, "Z"),
        not_usable_before: currentDate.toISOString().replace(/.\d+Z$/g, "Z"),
        not_usable_after: notUsableAfter.toISOString().replace(/.\d+Z$/g, "Z"),
      };

      const message: string = await requestDWGMessage(client, delegatedWriteGrant);

      send("update-create-dwg-status", {
        status: "pending",
      });

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
    } catch (error) {
      send("update-create-dwg-status", {
        status: "error",
      });
      console.error("Failed to request delegated write grant:", error);
      return undefined;
    }
  };

  const getUserProfile = async (): Promise<idOSUser> => {
    const client = await ensureKwilClient();
    return _getUserProfile(client);
  };

  /**
   * Requests an access grant for the given consumer
   */
  const requestPermission = async (options: RequestPermissionOptions): Promise<void> => {
    const client = await ensureKwilClient();

    updateIsleStatus("verified");

    toggleAnimation({
      expanded: true,
    });

    send("update-request-access-grant-status", {
      status: "request-permission",
      consumer: options.consumer,
      KYCPermissions: options.KYCPermissions,
    });

    const [error, result] = await goTry(async () => {
      invariant(enclaveProvider, "No `idOS enclave` found");

      const credential = await getCredentialById(client, ownerOriginalCredentials[0].id);
      invariant(credential, `No "idOSCredential" with id ${ownerOriginalCredentials[0].id} found`);

      const plaintextContent = await decryptCredentialContent(credential);

      const { content, encryptorPublicKey } = await enclaveProvider.encrypt(
        utf8Encode(plaintextContent),
        base64Decode(options.consumer.consumerAuthPublicKey),
      );

      const insertableCredential = await buildInsertableIDOSCredential(
        credential.user_id,
        "",
        base64Encode(content),
        options.consumer.consumerAuthPublicKey,
        base64Encode(encryptorPublicKey),
        {
          consumerAddress: options.consumer.consumerAuthPublicKey,
          lockedUntil: 0,
        },
      );

      await _shareCredential(client, {
        ...credential,
        ...insertableCredential,
        original_credential_id: credential.id,
        id: crypto.randomUUID(),
      });
    });

    if (error) {
      console.error(error);
      send("update-request-access-grant-status", {
        status: "error",
      });

      return;
    }

    send("update-request-access-grant-status", {
      status: "success",
    });

    const { permissions } = await getPermissions();

    send("update", {
      status: "verified",
      accessGrants: permissions,
    });
  };

  /**
   * Revokes an access grant for the given id
   */
  const revokePermission = async (id: string): Promise<unknown> => {
    const client = await ensureKwilClient();

    send("update-revoke-access-grant-status", {
      status: "pending",
    });

    const [error, result] = await goTry(() => {
      return removeCredential(client, id);
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

    const { permissions } = await getPermissions();

    send("update", {
      status: "verified",
      accessGrants: permissions,
    });

    return result;
  };

  const decryptCredentialContent = async (credential: idOSCredential): Promise<string> => {
    invariant(enclaveProvider, "No `idOS enclave` found");
    const user = await getUserProfile();
    const { address } = getAccount(wagmiConfig);

    await enclaveProvider.load();
    await enclaveProvider.ready(user.id, user.recipient_encryption_public_key);

    const decrypted = await enclaveProvider.decrypt(
      base64Decode(credential.content),
      base64Decode(credential.encryptor_public_key),
    );
    return utf8Decode(decrypted);
  };

  const safeParse = (value: string) => {
    try {
      return JSON.parse(value);
    } catch (error) {
      return {};
    }
  };

  /**
   * Process credentials and return calculated credential data
   */
  const getPermissions = async () => {
    invariant(kwilClient, "No `KwilActionClient` found");

    const acceptedIssuers = options.credentialRequirements.acceptedIssuers;
    const acceptedCredentialType = options.credentialRequirements.acceptedCredentialType;

    const credentials = await getAllCredentials(kwilClient);
    const originalCredentials = credentials.filter((cred) => !cred.original_id);

    ownerOriginalCredentials = originalCredentials;

    const originalCredentialTypes = originalCredentials.reduce(
      (acc, cred) => {
        const publicNotes = safeParse(cred.public_notes);
        acc[cred.id] = publicNotes.type;
        return acc;
      },
      {} as Record<string, string>,
    );
    const duplicateCredentials = credentials.filter((cred) => cred.original_id);

    // This logic is done in order to understand if the user has to pass the KYC process.
    const matchingCredentials = originalCredentials.filter((cred) => {
      const publicNotes = safeParse(cred.public_notes);
      return acceptedIssuers?.some(
        (issuer) =>
          issuer.authPublicKey === cred.issuer_auth_public_key &&
          acceptedCredentialType === publicNotes?.type,
      );
    });

    const groupedCredentials = Object.groupBy(
      duplicateCredentials,
      (cred) => cred.original_id ?? "",
    );

    // Get all the access grants owned by the signer.
    const accessGrants = await getAccessGrantsOwned(kwilClient);

    // Filter out the known access grants. This is done by checking if the `ag` `data_id` is equal to any of the `duplicate_ids`
    const knownAccessGrants = accessGrants.filter((ag) => {
      return Object.values(groupedCredentials).some((duplicates = []) => {
        return duplicates.find((duplicate) => duplicate.id === ag.data_id);
      });
    });

    // Now that we know which access grants are known, we need to find to which consumer they belong to.
    // For this, we need to take the `options.credentialRequirements.integratedConsumers` and check if any of the `authPublicKey` matches the `ag_grantee_wallet_identifier`
    const permissions = new Map();

    for (const consumer of options.credentialRequirements.integratedConsumers) {
      const matchingAccessGrants = knownAccessGrants.filter((ag) => {
        return ag.ag_grantee_wallet_identifier === consumer.consumerAuthPublicKey;
      });

      permissions.set(
        consumer,
        matchingAccessGrants
          .map((ag) => {
            const originalId = duplicateCredentials.find(
              (cred) => cred.id === ag.data_id,
            )?.original_id;

            if (!originalId) {
              return null;
            }

            return {
              id: ag.id,
              dataId: ag.data_id,
              lockedUntil: ag.locked_until,
              type: originalCredentialTypes[originalId],
              originalCredentialId: originalId,
            };
          })
          .filter(Boolean),
      );
    }

    return {
      matchingCredentials,
      permissions,
    };
  };

  /**
   * View credential details for the given `id`
   */
  const viewCredentialDetails = async (id: string): Promise<void> => {
    const [error, result] = await goTry(async () => {
      const client = await ensureKwilClient();
      invariant(kwilClient, "No `KwilActionClient` found");

      send("update-view-credential-details-status", {
        status: "pending",
      });

      const credential = await getCredentialOwned(client, id);

      // Ensure enclave is initialized before trying to decrypt
      await setupEnclave();
      invariant(enclaveProvider, "Enclave not initialized");

      const content = await decryptCredentialContent(credential);

      send("update-view-credential-details-status", {
        status: "success",
        credential: { ...credential, content },
      });
    });

    if (error) {
      console.error(error);
      send("update-view-credential-details-status", {
        status: "error",
      });
    }
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
        send("update", {
          status: "not-connected",
        });
        return;
      }

      try {
        const client = await ensureKwilClient();

        // Check if the user has a profile and update the isle status accordingly.
        const _hasProfile = await hasProfile(client, account.address as string);

        if (!_hasProfile) {
          toggleAnimation({ expanded: true, noDismiss: true });
          send("update", {
            status: "no-profile",
          });
          return;
        }
        const { matchingCredentials, permissions } = await getPermissions();

        if (matchingCredentials.length === 0) {
          send("update", {
            status: "not-verified",
          });

          return;
        }

        send("update", {
          status: "verified",
          accessGrants: permissions,
        });
      } catch (error) {
        console.error("Failed to initialize:", error);
        send("update", {
          status: "error",
        });
      }
    });

    // Send initial configuration
    channel.post("initialize", {
      theme,
    });

    // Handle wallet linking requests
    // @todo: make the domain environment aware.
    channel.on("link-wallet", async () => {
      const account = getAccount(wagmiConfig);
      const url = `https://dashboard.staging.idos.network/wallets?add-wallet=${account.address}&callbackUrl=${window.location.href}`;
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
  iframe.src = "https://isle.idos.network";
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

  const toggleAnimation = ({
    expanded,
    noDismiss,
    timeout = 700,
  }: { expanded: boolean; noDismiss?: boolean; timeout?: number }): void => {
    setTimeout(() => {
      send("toggle-animation", {
        expanded,
        noDismiss,
      });
    }, timeout);
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
          throw new Error("Failed to get `walletClient`");
        }
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

  const updateIsleStatus = async (status: IsleStatus): Promise<void> => {
    const payload = {
      status,
    };

    if (status === "verified") {
      const { permissions } = await getPermissions();
      Object.assign(payload, { accessGrants: permissions });
    }

    send("update", payload);
  };

  const onIsleMessage = (handler: (message: IsleNodeMessage) => void) => {
    const currentChannel = channel;
    if (!currentChannel) return () => {};

    const messageTypes: IsleNodeMessage["type"][] = [
      "verify-identity",
      "initialized",
      "updated",
      "connect-wallet",
      "link-wallet",
      "create-profile",
      "request-dwg",
      "revoke-permission",
      "view-credential-details",
    ];

    const cleanups = messageTypes.map((type) =>
      currentChannel.on(type, (data) => {
        handler({ type, data } as IsleNodeMessage);
      }),
    );

    return () => {
      for (const cleanup of cleanups) {
        cleanup?.();
      }
    };
  };

  const onIsleStatusChange = (handler: (status: IsleStatus) => void): (() => void) => {
    const currentChannel = channel;
    if (!currentChannel) return () => {};

    return currentChannel.on("updated", (data) => {
      handler(data.status as IsleStatus);
    });
  };

  const buildIssuerClientConfig = async (): Promise<IssuerClientConfig | null> => {
    await setupSigner();
    if (!signer) {
      console.error("No signer available");
      return null;
    }

    await ensureKwilClient();
    if (!kwilClient) {
      console.error("No KwilClient available");
      return null;
    }
    if (!kwilSigner) {
      console.error("No kwilSigner available");
      return null;
    }

    await setupEnclave();
    if (!enclaveProvider) {
      console.error("No enclave provider available");
      return null;
    }

    const { address } = getAccount(wagmiConfig);
    if (!address) {
      console.error("No address available");
      return null;
    }

    return {
      store,
      kwilClient,
      enclaveProvider,
      signer: kwilSigner,
      userAddress: address,
    };
  };

  // Return the public interface
  return {
    connect,
    destroy,
    send,
    requestDelegatedWriteGrant,
    requestPermission,
    revokePermission,
    viewCredentialDetails,
    toggleAnimation,
    updateIsleStatus,
    onIsleMessage,
    onIsleStatusChange,
    buildIssuerClientConfig,
  };
};
