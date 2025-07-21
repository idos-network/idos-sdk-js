import type { idOSCredential, idOSGrant } from "@idos-network/consumer";
import type { JsonRpcSigner } from "ethers";
import invariant from "tiny-invariant";
import { create } from "zustand";
import { devtools } from "zustand/middleware";

// const _idOSClient = new idOSClientConfiguration({
//   nodeUrl: process.env.NEXT_PUBLIC_IDOS_NODE_URL ?? "",
//   enclaveOptions: {
//     container: "#idOS-enclave",
//     url: process.env.NEXT_PUBLIC_IDOS_ENCLAVE_URL ?? "",
//   },
// });

interface IdosState {
  // Client instances
  client:
    | { state: "idle" }
    | {
        state: "with-user-signer";
        hasProfile: () => Promise<boolean>;
        logIn: () => Promise<unknown & { state: "logged-in" }>;
      }
    | null;
  loggedInClient: {
    state: "logged-in";
    user: { id: string };
    filterCredentials: (options: {
      acceptedIssuers: { authPublicKey: string }[];
    }) => Promise<idOSCredential[]>;
    getAccessGrantsOwned: () => Promise<idOSGrant[]>;
    requestAccessGrant: (
      credentialId: string,
      options: { consumerEncryptionPublicKey: string; consumerAuthPublicKey: string },
    ) => Promise<idOSCredential>;
  } | null;

  // User profile
  hasProfile: boolean | null;

  // Credentials
  credentials: idOSCredential[];

  // Retry logic
  findCredentialAttempts: number;
  maxFindCredentialAttempts: number;

  // Loading state
  isInitializing: boolean;
  isLoggingIn: boolean;
  isFindingCredentials: boolean;

  // Error state
  error: string | null;

  // Loading state
  loadingMessage: string | null;
}

interface IdosActions {
  // Client management
  initializeClient: (signer: JsonRpcSigner) => Promise<void>;
  login: () => Promise<void>;

  // Profile management
  checkProfile: () => Promise<boolean>;

  // Credential management
  findCredentials: () => Promise<idOSCredential[]>;
  shareCredential: (credentialId: string) => Promise<idOSCredential>;

  // State management
  setError: (error: string | null) => void;
  clearError: () => void;
  reset: () => void;

  // Internal helpers
  incrementFindAttempts: () => void;
  resetFindAttempts: () => void;
  getGrants: () => Promise<idOSGrant[]>;
}

type IdosStore = IdosState & IdosActions;

const initialState: IdosState = {
  client: null,
  loggedInClient: null,
  hasProfile: null,
  credentials: [],
  findCredentialAttempts: 0,
  maxFindCredentialAttempts: 40,
  isInitializing: false,
  isLoggingIn: false,
  isFindingCredentials: false,
  error: null,
  loadingMessage: null,
};

const NODES_URL = process.env.NEXT_PUBLIC_IDOS_NODE_URL ?? "";
const ENCLAVE_URL = process.env.NEXT_PUBLIC_IDOS_ENCLAVE_URL ?? "";
console.log({ NODES_URL, ENCLAVE_URL });
export const useIdosStore = create<IdosStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      initializeClient: async (signer) => {
        try {
          // biome-ignore lint/suspicious/noDebugger: testing
          debugger;
          if (typeof window === "undefined") return;
          const { idOSClientConfiguration } = await import("@idos-network/client");
          const idosConfig = new idOSClientConfiguration({
            nodeUrl: NODES_URL,
            enclaveOptions: {
              container: "#idOS-enclave",
              url: ENCLAVE_URL,
            },
          });
          set({ isInitializing: true, error: null, loadingMessage: "Initializing idOS client..." });
          const idleClient = await idosConfig.createClient();
          const withUserSigner = await idleClient.withUserSigner(signer);

          set({
            client: withUserSigner,
            isInitializing: false,
            loadingMessage: null,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Failed to initialize client",
            isInitializing: false,
            loadingMessage: null,
          });
        }
      },

      login: async () => {
        const { client } = get();
        // biome-ignore lint/suspicious/noDebugger: testing
        debugger;
        if (!client) {
          set({ error: "Client not initialized", loadingMessage: null });
          return;
        }

        try {
          set({ isLoggingIn: true, error: null, loadingMessage: "Logging in..." });
          invariant(client.state === "with-user-signer", "Client is not logged out");

          const loggedInClient = (await client.logIn()) as unknown as undefined;

          set({
            loggedInClient,
            isLoggingIn: false,
            loadingMessage: null,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Failed to login",
            isLoggingIn: false,
            loadingMessage: null,
          });
        }
      },

      checkProfile: async () => {
        const { client } = get();
        if (!client) {
          set({ error: "Client not initialized", loadingMessage: null });
          return false;
        }

        try {
          invariant(client.state === "with-user-signer", "Client is not logged out");
          const hasProfile = await client.hasProfile();

          set({ hasProfile, loadingMessage: null });
          return hasProfile;
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Failed to check profile",
            hasProfile: false,
            loadingMessage: null,
          });
          return false;
        }
      },

      findCredentials: async () => {
        const { loggedInClient, findCredentialAttempts, maxFindCredentialAttempts } = get();

        if (!loggedInClient) {
          set({ error: "Not logged in", loadingMessage: null });
          return [];
        }

        if (findCredentialAttempts >= maxFindCredentialAttempts) {
          set({ error: "Maximum credential search attempts reached" });
          return [];
        }

        try {
          set({
            isFindingCredentials: true,
            error: null,
            loadingMessage: "Finding credentials...",
          });

          if (!process.env.NEXT_PUBLIC_KRAKEN_ISSUER_PUBLIC_KEY) {
            console.warn("`process.env.NEXT_PUBLIC_KRAKEN_ISSUER_PUBLIC_KEY` is required");
            return;
          }

          const credentials = await loggedInClient.filterCredentials({
            acceptedIssuers: [
              {
                authPublicKey: process.env.NEXT_PUBLIC_KRAKEN_ISSUER_PUBLIC_KEY,
              },
            ],
          });

          set({
            credentials,
            isFindingCredentials: false,
            loadingMessage: null,
          });

          if (credentials.length === 0) {
            get().incrementFindAttempts();
          } else {
            get().resetFindAttempts();
          }

          return credentials;
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Failed to find credentials",
            isFindingCredentials: false,
            loadingMessage: null,
          });
          get().incrementFindAttempts();
          return [];
        }
      },

      getGrants: async () => {
        const { loggedInClient } = get();
        if (!loggedInClient) {
          throw new Error("Not logged in");
        }
        const grants = await loggedInClient.getAccessGrantsOwned();
        return grants;
      },

      shareCredential: async (credentialId) => {
        const { loggedInClient } = get();

        if (!loggedInClient) {
          throw new Error("Not logged in");
        }

        invariant(
          process.env.NEXT_PUBLIC_IDOS_ENCRYPTION_PUBLIC_KEY,
          "NEXT_PUBLIC_IDOS_ENCRYPTION_PUBLIC_KEY is not set",
        );
        invariant(
          process.env.NEXT_PUBLIC_IDOS_PUBLIC_KEY,
          "NEXT_PUBLIC_IDOS_PUBLIC_KEY is not set",
        );

        try {
          const sharedCredential = await loggedInClient.requestAccessGrant(credentialId, {
            consumerEncryptionPublicKey: process.env.NEXT_PUBLIC_IDOS_ENCRYPTION_PUBLIC_KEY,
            consumerAuthPublicKey: process.env.NEXT_PUBLIC_IDOS_PUBLIC_KEY,
          });
          return sharedCredential as unknown;
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Failed to share credential";
          set({ error: errorMessage, loadingMessage: null });
          throw new Error(errorMessage);
        }
      },

      setError: (error) => set({ error, loadingMessage: null }),
      clearError: () => set({ error: null, loadingMessage: null }),

      reset: () => set(initialState),

      incrementFindAttempts: () =>
        set((state) => ({
          findCredentialAttempts: state.findCredentialAttempts + 1,
        })),

      resetFindAttempts: () => set({ findCredentialAttempts: 0 }),
    }),
    {
      name: "neobank-idos-store",
    },
  ),
);
