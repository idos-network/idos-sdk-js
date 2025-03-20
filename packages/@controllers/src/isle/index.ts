/* cspell:disable-next-line */
import {
  type DelegatedWriteGrantSignatureRequest,
  type IsleControllerMessage,
  type IsleMessageHandler,
  type IsleNodeMessage,
  type IsleTheme,
  type KwilActionClient,
  getUserProfile as _getUserProfile,
  shareCredential as _shareCredential,
  base64Decode,
  base64Encode,
  buildInsertableIDOSCredential,
  createKwilSigner,
  createWebKwilClient,
  getAccessGrantsOwned,
  getAllCredentials,
  getCredentialById,
  getCredentialOwned,
  hasProfile,
  type idOSCredential,
  type idOSUser,
  removeCredential,
  requestDWGMessage,
  utf8Decode,
  utf8Encode,
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
import { IframeEnclave } from "../secure-enclave";
import type { EnclaveOptions, EnclaveProvider } from "../secure-enclave/types";

/**
 * Meta information about an actor.
 */ interface Meta {
  url: string;
  name: string;
  logo: string;
}

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
      consumerPublicKey: string;
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
    consumerPublicKey: string;
    /** Meta information about the consumer */
    meta: Meta;
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
  /** Starts the request for a `delegated write grant` */
  startRequestDelegatedWriteGrant: (options: RequestPermissionOptions) => void;
  /** Requests a `delegated write grant` for the given `consumer` */
  requestDelegatedWriteGrant: (
    options: RequestPermissionOptions,
  ) => Promise<{ signature: string; writeGrant: DelegatedWriteGrantSignatureRequest } | undefined>;
  /** Requests an access grant for the given `consumer` */
  requestPermission: (options: RequestPermissionOptions) => Promise<void>;
  /** Revokes an access grant for the given `id` */
  revokePermission: (id: string) => Promise<unknown>;
  /** View credential details for the given `id` */
  viewCredentialDetails: (id: string) => Promise<idOSCredential>;
  /** Get the user profile */
  getUserProfile: () => Promise<idOSUser>;
  /** Toggle ISLE animation (expand/collapse) */
  toggleAnimation: ({ expanded, noDismiss }: { expanded: boolean; noDismiss?: boolean }) => void;
  /** Complete the verification process */
  completeVerification: () => void;
  /** Get the Kwil client */
  getKwilClient: () => Promise<KwilActionClient | undefined>;
  /** Get the enclave */
  getEnclave: () => Promise<EnclaveProvider | null>;
  /** Decrypt credential content */
  decryptCredentialContent: (credential: idOSCredential) => Promise<string>;
  /** Encrypt credential content */
  encryptCredentialContent: (
    content: string,
    encryptorPublicKey: string,
  ) => Promise<{
    content: string;
    encryptorPublicKey: string;
  }>;
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
  let enclave: EnclaveProvider | null = null;
  const controller: Controller = createController({
    targetOrigin: "https://localhost:5174/",
  });
  let channel: ChannelInstance<IsleControllerMessage, IsleNodeMessage> | null = null;
  let signer: JsonRpcSigner | undefined;
  let kwilClient: KwilActionClient | undefined;
  const iframeId = `iframe-isle-${Math.random().toString(36).slice(2, 9)}`;
  const { containerId, theme } = { containerId: options.container, theme: options.theme };
  let ownerOriginalCredentials: idOSCredential[] = [];

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
    if (enclave) return;
    try {
      const enclaveInstance = new IframeEnclave(options.enclaveOptions);
      await enclaveInstance.load();
      enclave = enclaveInstance;
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
      await setupSigner();
      await setupEnclave();
    } else if (account.status === "disconnected") {
      signer = undefined;
    }

    send("update", {
      address: account.address,
    });
  };

  const startRequestDelegatedWriteGrant = (options: RequestPermissionOptions) => {
    send("update", {
      status: "not-verified",
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
  };

  const requestDelegatedWriteGrant = async (
    options: RequestPermissionOptions,
  ): Promise<
    { signature: string; writeGrant: DelegatedWriteGrantSignatureRequest } | undefined
  > => {
    const { address } = getAccount(wagmiConfig);
    const currentTimestamp = Date.now();
    const currentDate = new Date(currentTimestamp);
    const notUsableAfter = new Date(currentTimestamp + 24 * 60 * 60 * 1000);

    const delegatedWriteGrant = {
      id: crypto.randomUUID(),
      owner_wallet_identifier: address as string,
      grantee_wallet_identifier: options.consumer.consumerPublicKey,
      issuer_public_key: options.consumer.consumerPublicKey,
      access_grant_timelock: currentDate.toISOString().replace(/.\d+Z$/g, "Z"),
      not_usable_before: currentDate.toISOString().replace(/.\d+Z$/g, "Z"),
      not_usable_after: notUsableAfter.toISOString().replace(/.\d+Z$/g, "Z"),
    };

    kwilClient =
      kwilClient ||
      (await createWebKwilClient({
        // @todo: make the domain environment aware.
        nodeUrl: "https://nodes.playground.idos.network",
      }));

    invariant(kwilClient, "No `KwilActionClient` found");
    const message: string = await requestDWGMessage(kwilClient, delegatedWriteGrant);

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
  };

  const getUserProfile = async (): Promise<idOSUser> => {
    invariant(kwilClient, "No `KwilActionClient` found");
    return _getUserProfile(kwilClient);
  };

  /**
   * Requests an access grant for the given consumer
   */
  const requestPermission = async (options: RequestPermissionOptions): Promise<void> => {
    invariant(kwilClient, "No `KwilActionClient` found");

    send("update-request-access-grant-status", {
      status: "request-permission",
      consumer: options.consumer,
      KYCPermissions: options.KYCPermissions,
    });

    const [error, result] = await goTry(async () => {
      invariant(kwilClient, "No `KwilActionClient` found");
      invariant(enclave, "No `idOS enclave` found");

      const credential = await getCredentialById(kwilClient, ownerOriginalCredentials[0].id);
      invariant(credential, `No "idOSCredential" with id ${ownerOriginalCredentials[0].id} found`);

      const plaintextContent = await decryptCredentialContent(credential);

      const { content, encryptorPublicKey } = await enclave.encrypt(
        utf8Encode(plaintextContent),
        base64Decode(options.consumer.consumerPublicKey),
      );

      const insertableCredential = await buildInsertableIDOSCredential(
        credential.user_id,
        "",
        base64Encode(content),
        options.consumer.consumerPublicKey,
        base64Encode(encryptorPublicKey),
        {
          consumerAddress: options.consumer.consumerPublicKey,
          lockedUntil: 0,
        },
      );

      await _shareCredential(kwilClient, {
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
    invariant(kwilClient, "No `KwilActionClient` found");
    send("update-revoke-access-grant-status", {
      status: "pending",
    });

    const [error, result] = await goTry(() => {
      invariant(kwilClient, "No `KwilActionClient` found");
      return removeCredential(kwilClient, id);
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
    invariant(enclave, "No `idOS enclave` found");
    const user = await getUserProfile();
    const { address } = getAccount(wagmiConfig);

    await enclave.ready(user.id, address, address, user.recipient_encryption_public_key);

    const decrypted = await enclave.decrypt(
      base64Decode(credential.content),
      base64Decode(credential.encryptor_public_key),
    );
    return utf8Decode(decrypted);
  };

  const encryptCredentialContent = async (
    content: string,
    encryptorPublicKey: string,
  ): Promise<{
    content: string;
    encryptorPublicKey: string;
  }> => {
    invariant(enclave, "No `idOS enclave` found");
    const user = await getUserProfile();
    const { address } = getAccount(wagmiConfig);

    await enclave.ready(user.id, address, address, user.recipient_encryption_public_key);

    const encrypted = await enclave.encrypt(utf8Encode(content), base64Decode(encryptorPublicKey));
    return {
      content: base64Encode(encrypted.content),
      encryptorPublicKey: base64Encode(encrypted.encryptorPublicKey),
    };
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
        return ag.ag_grantee_wallet_identifier === consumer.consumerPublicKey;
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

  const completeVerification = async () => {
    const { permissions } = await getPermissions();

    send("update", {
      status: "verified",
      accessGrants: permissions,
    });
  };

  /**
   * View credential details for the given `id`
   */
  const viewCredentialDetails = async (id: string): Promise<idOSCredential> => {
    invariant(kwilClient, "No `KwilActionClient` found");
    // Am pretty sure `getCredentialOwned is not the correct function to use. please switch to the right one.
    // No need to update any steps after updating fetch credential function.
    const credential = await getCredentialOwned(kwilClient, id);
    const content = await decryptCredentialContent(credential);
    return { ...credential, content };
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

      kwilClient = await createWebKwilClient({
        // @todo: make the domain environment aware.
        nodeUrl: "https://nodes.playground.idos.network",
      });

      const [kwilSigner] = createKwilSigner(signer);

      kwilClient.setSigner(kwilSigner);

      // Check if the user has a profile and update the isle status accordingly.
      const _hasProfile = await hasProfile(kwilClient, account.address as string);

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
        toggleAnimation({ expanded: false, noDismiss: false });

        return;
      }

      send("update", {
        status: "verified",
        accessGrants: permissions,
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
  iframe.src = "https://localhost:5174/";
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

  const getKwilClient = async (): Promise<KwilActionClient | undefined> => {
    return kwilClient;
  };

  const getEnclave = async (): Promise<EnclaveProvider | null> => {
    return enclave;
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
    startRequestDelegatedWriteGrant,
    requestDelegatedWriteGrant,
    requestPermission,
    revokePermission,
    viewCredentialDetails,
    getUserProfile,
    toggleAnimation,
    completeVerification,
    getEnclave,
    getKwilClient,
    decryptCredentialContent,
    encryptCredentialContent,
  };
};
