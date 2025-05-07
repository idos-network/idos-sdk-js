import {
  type EnclaveOptions,
  type IsleControllerMessage,
  type IsleMessageHandler,
  type IsleNodeMessage,
  type IsleStatus,
  type IsleTheme,
  base64Decode,
  base64Encode,
  buildInsertableIDOSCredential,
  type idOSClient,
  idOSClientConfiguration,
  type idOSCredential,
  utf8Decode,
  utf8Encode,
} from "@idos-network/core";
import type { DelegatedWriteGrant } from "@idos-network/core";
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
  watchAccount,
} from "@wagmi/core";
import { mainnet, sepolia } from "@wagmi/core/chains";
import { BrowserProvider } from "ethers";
import { goTry } from "go-try";
import invariant from "tiny-invariant";

const assertNever = (x: never): never => {
  throw new Error(`Unexpected object: ${x}`);
};

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

  /** The targetOrigin of the hosted isle */
  targetOrigin: string;

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
      consumerEncryptionPublicKey: string;
      kycPermissions: string[];
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
    consumerEncryptionPublicKey: string;
    /** Meta information about the consumer */
    meta: Meta;
  };
  KYCPermissions: string[];
}
interface RequestDelegatedWriteGrantOptions {
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
interface idOSIsleController {
  /** Cleans up and removes the Isle instance */
  destroy: () => void;
  /** Sends a message to the Isle iframe */
  send: (type: IsleControllerMessage["type"], data: IsleControllerMessage["data"]) => void;
  /** Requests a `delegated write grant` for the given `consumer` */
  requestDelegatedWriteGrant: (
    options: RequestDelegatedWriteGrantOptions,
  ) => Promise<{ signature: string; writeGrant: DelegatedWriteGrant } | undefined>;
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

  setupWagmiConfig: (wagmiConfig: unknown) => void;

  readonly idosClient: idOSClient;

  logClientIn: () => Promise<void>;

  options: idOSIsleControllerOptions;

  hasConsumerPermission: (consumer: {
    meta: Meta;
    consumerAuthPublicKey: string;
    consumerEncryptionPublicKey: string;
    kycPermissions: string[];
  }) => Promise<boolean>;
}

// Singleton wagmi config instance shared across all Isle instances
let wagmiConfig: Config;

/**
 * Creates a new idOS Isle instance.
 * This factory function sets up an iframe-based communication channel with the Isle UI
 * and manages wallet connections and message passing.
 *
 * @param options - Configuration options for the Isle instance
 * @returns An interface for interacting with the Isle instance
 */
export const createIsleController = (options: idOSIsleControllerOptions): idOSIsleController => {
  const nodeUrl = process.env.NEXT_PUBLIC_KWIL_NODE_URL || "https://nodes.playground.idos.network";
  let idosClient: idOSClient = new idOSClientConfiguration({
    nodeUrl,
    enclaveOptions: options.enclaveOptions,
  });
  // Internal state
  let iframe: HTMLIFrameElement | null = null;
  const controller: Controller = createController({
    targetOrigin: options.targetOrigin,
  });
  let channel: ChannelInstance<IsleControllerMessage, IsleNodeMessage> | null = null;

  const iframeId = `iframe-isle-${Math.random().toString(36).slice(2, 9)}`;
  const { containerId, theme } = { containerId: options.container, theme: options.theme };
  let ownerOriginalCredentials: idOSCredential[] = [];

  const setupSigner = async (): Promise<void> => {
    const walletClient = await getWalletClient(wagmiConfig);
    invariant(walletClient, "No `walletClient` found");

    const provider = new BrowserProvider(walletClient.transport);
    const signer = await provider.getSigner();

    if (idosClient.state === "configuration") {
      idosClient = await idosClient.createClient();
    }

    switch (idosClient.state) {
      case "idle":
        idosClient = await idosClient.withUserSigner(signer);
        break;
      case "with-user-signer":
      case "logged-in":
        if (signer.address !== idosClient.walletIdentifier) {
          idosClient = await idosClient.logOut();
          idosClient = await idosClient.withUserSigner(signer);
        }
        break;
      default:
        assertNever(idosClient);
    }
  };

  const setupWagmiConfig = async (_wagmiConfig: unknown) => {
    if (wagmiConfig) return;
    wagmiConfig = _wagmiConfig as Config;

    watchAccountChanges();
    reconnect(wagmiConfig).catch((error) => console.error(error));
  };

  /**
   * Handles changes in the wallet connection status
   * Updates the signer and notifies the Isle UI of the change
   */
  const handleAccountChange = async (account: {
    status: "disconnected" | "connecting" | "connected" | "reconnecting";
    address?: string;
  }): Promise<void> => {
    if (account.status === "connecting") {
      return;
    }

    if (account.status === "connected") {
      try {
        await setupSigner();
      } catch (error) {
        console.error("Failed to initialize:", error);
        send("update", { status: "error" });
        return;
      }
    }

    send("update", { address: account.address });
  };

  const requestDelegatedWriteGrant = async (
    options: RequestDelegatedWriteGrantOptions,
  ): Promise<{ signature: string; writeGrant: DelegatedWriteGrant } | undefined> => {
    invariant(idosClient.state === "logged-in", "idOS client is not logged in");

    try {
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

      const currentTimestamp = Date.now();
      const currentDate = new Date(currentTimestamp);
      const notUsableAfter = new Date(currentTimestamp + 24 * 60 * 60 * 1000);

      const delegatedWriteGrant = {
        id: crypto.randomUUID(),
        owner_wallet_identifier: idosClient.walletIdentifier,
        grantee_wallet_identifier: options.consumer.consumerAuthPublicKey,
        issuer_public_key: options.consumer.consumerAuthPublicKey,
        access_grant_timelock: currentDate.toISOString().replace(/.\d+Z$/g, "Z"),
        not_usable_before: currentDate.toISOString().replace(/.\d+Z$/g, "Z"),
        not_usable_after: notUsableAfter.toISOString().replace(/.\d+Z$/g, "Z"),
      };

      const message: string = await idosClient.requestDWGMessage(delegatedWriteGrant);

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

  /**
   * Requests an access grant for the given consumer
   */
  const requestPermission = async (options: RequestPermissionOptions): Promise<void> => {
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
      invariant(idosClient.state === "logged-in", "idOS client is not logged in");

      const credential = await idosClient.getCredentialById(ownerOriginalCredentials[0].id);
      invariant(credential, `No "idOSCredential" with id ${ownerOriginalCredentials[0].id} found`);

      const plaintextContent = await decryptCredentialContent(credential);

      await idosClient.enclaveProvider.ready(
        idosClient.user.id,
        idosClient.user.recipient_encryption_public_key,
      );
      const { content, encryptorPublicKey } = await idosClient.enclaveProvider.encrypt(
        utf8Encode(plaintextContent),
        base64Decode(options.consumer.consumerEncryptionPublicKey),
      );

      await idosClient.shareCredential({
        ...credential,
        ...(await buildInsertableIDOSCredential(
          credential.user_id,
          "",
          base64Encode(content),
          options.consumer.consumerAuthPublicKey,
          base64Encode(encryptorPublicKey),
        )),
        original_credential_id: credential.id,
        id: crypto.randomUUID(),
        grantee_wallet_identifier: options.consumer.consumerAuthPublicKey,
        locked_until: 0,
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
    invariant(idosClient.state === "logged-in", "idOS client is not logged in");

    send("update-revoke-access-grant-status", {
      status: "pending",
    });

    const [error, result] = await goTry(() => {
      // Just to make TS remember that the idosConsumer is logged in.
      invariant(idosClient.state === "logged-in");

      return idosClient.removeCredential(id);
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
    invariant(idosClient.state === "logged-in", "idOS client is not logged in");

    await idosClient.enclaveProvider.ready(
      idosClient.user.id,
      idosClient.user.recipient_encryption_public_key,
    );
    return utf8Decode(
      await idosClient.enclaveProvider.decrypt(
        base64Decode(credential.content),
        base64Decode(credential.encryptor_public_key),
      ),
    );
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
    invariant(idosClient.state === "logged-in", "idOS client is not logged in");

    const acceptedIssuers = options.credentialRequirements.acceptedIssuers;
    const acceptedCredentialType = options.credentialRequirements.acceptedCredentialType;

    const credentials = await idosClient.getAllCredentials();
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
    const accessGrants = await idosClient.getAccessGrantsOwned();

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
      invariant(idosClient.state === "logged-in", "idOS client is not logged in");

      send("update-view-credential-details-status", {
        status: "pending",
      });

      const credential = await idosClient.getCredentialOwned(id);
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

      if (idosClient.state === "configuration" || idosClient.state === "idle") {
        send("update", {
          status: "not-connected",
        });
        return;
      }

      try {
        let _hasProfile: boolean;
        switch (idosClient.state) {
          case "with-user-signer":
            _hasProfile = await idosClient.hasProfile();
            break;
          case "logged-in":
            _hasProfile = true;
            break;
          default:
            assertNever(idosClient);
            _hasProfile = false; // this is unreachable, it's just to make TS happy.
        }

        if (!_hasProfile) {
          toggleAnimation({ expanded: true, noDismiss: true });
          send("update", {
            status: "no-profile",
          });
          return;
        }

        if (idosClient.state !== "logged-in") {
          idosClient = await idosClient.logIn();
        }

        const { matchingCredentials, permissions } = await getPermissions();

        if (matchingCredentials.length === 0) {
          send("toggle-animation", { expanded: true });
          send("update", {
            status: "not-verified",
          });

          return;
        }

        const issuerPermission = permissions.get(
          options.credentialRequirements.integratedConsumers[0],
        )[0];

        if (!issuerPermission) {
          await requestPermission({
            consumer: options.credentialRequirements.integratedConsumers[0],
            KYCPermissions: options.credentialRequirements.integratedConsumers[0].kycPermissions,
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
      const dashboardUrl =
        process.env.NEXT_PUBLIC_IDOS_DASHBOARD_URL ?? "https://dashboard.playground.idos.network/";
      const account = getAccount(wagmiConfig);
      const url = `${dashboardUrl}wallets?add-wallet=${account.address}&callbackUrl=${window.location.href}`;
      window.location.href = url;
    });

    channel.start();
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

  const logClientIn = async (): Promise<void> => {
    if (idosClient.state === "logged-in") return;
    invariant(idosClient.state !== "configuration", "idOS client is not configured");
    invariant(idosClient.state !== "idle", "idOS client doesn't have a signer yet");
    idosClient = await idosClient.logIn();
  };

  const container = document.getElementById(containerId);
  if (!container) {
    throw new Error(`Element with id "${containerId}" not found`);
  }

  // Clean up any existing iframe
  const existingIframe = container.querySelector("iframe");
  if (existingIframe) {
    console.warn("Removing existing isle iframe");
    container.removeChild(existingIframe);
  }

  // Create and mount the idOSIsle iframe
  iframe = document.createElement("iframe");
  iframe.id = iframeId;
  // @todo: make the domain environment aware.
  iframe.src = options.targetOrigin;
  iframe.style.width = "100%";
  iframe.style.height = "100%";
  iframe.style.border = "none";

  container.appendChild(iframe);
  setupController();

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

  // Return the public interface
  return {
    get idosClient() {
      return idosClient;
    },
    logClientIn,
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
    setupWagmiConfig,
    get options() {
      return options;
    },

    hasConsumerPermission: async (consumer: {
      meta: Meta;
      consumerAuthPublicKey: string;
      consumerEncryptionPublicKey: string;
      kycPermissions: string[];
    }) => {
      const { permissions } = await getPermissions();
      const consumerPermissions = permissions.get(consumer);
      return consumerPermissions?.length > 0;
    },
  };
};
