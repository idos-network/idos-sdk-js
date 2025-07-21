import {
  type idOSClient,
  idOSClientConfiguration,
  type idOSClientLoggedIn,
} from "@idos-network/client";
import type { idOSCredential, idOSGrant } from "@idos-network/consumer";
import invariant from "tiny-invariant";
import { create } from "zustand";
import { devtools } from "zustand/middleware";

const _idOSClient = new idOSClientConfiguration({
  nodeUrl: process.env.NEXT_PUBLIC_IDOS_NODE_URL!,
  enclaveOptions: {
    container: "#idOS-enclave",
    url: process.env.NEXT_PUBLIC_IDOS_ENCLAVE_URL!,
  },
});

interface IdosState {
  // Client instances
  client: idOSClient | null;
  loggedInClient: idOSClientLoggedIn | null;

  // User profile
  hasProfile: boolean | null;

  // Credentials
  credentials: idOSCredential[];
  sharedCredential: idOSCredential | null;

  // Retry logic
  findCredentialAttempts: number;
  maxFindCredentialAttempts: number;

  // Loading state
  isInitializing: boolean;
  isLoggingIn: boolean;
  isFindingCredentials: boolean;

  // Error state
  error: string | null;
}

interface IdosActions {
  // Client management
  initializeClient: (signer: any) => Promise<void>;
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
  sharedCredential: null,
  findCredentialAttempts: 0,
  maxFindCredentialAttempts: 40,
  isInitializing: false,
  isLoggingIn: false,
  isFindingCredentials: false,
  error: null,
};

export const useIdosStore = create<IdosStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      initializeClient: async (signer) => {
        try {
          set({ isInitializing: true, error: null });
          const idleClient = await _idOSClient.createClient();
          const withUserSigner = await idleClient.withUserSigner(signer);

          set({
            client: withUserSigner,
            isInitializing: false,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Failed to initialize client",
            isInitializing: false,
          });
        }
      },

      login: async () => {
        const { client } = get();
        if (!client) {
          set({ error: "Client not initialized" });
          return;
        }

        try {
          set({ isLoggingIn: true, error: null });
          invariant(client.state === "with-user-signer", "Client is not logged out");

          const loggedInClient = await client.logIn();

          set({
            loggedInClient,
            isLoggingIn: false,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Failed to login",
            isLoggingIn: false,
          });
        }
      },

      checkProfile: async () => {
        const { client } = get();
        if (!client) {
          set({ error: "Client not initialized" });
          return false;
        }

        try {
          invariant(client.state === "with-user-signer", "Client is not logged out");
          const hasProfile = await client.hasProfile();

          set({ hasProfile });
          return hasProfile;
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Failed to check profile",
            hasProfile: false,
          });
          return false;
        }
      },

      findCredentials: async () => {
        const { loggedInClient, findCredentialAttempts, maxFindCredentialAttempts } = get();

        if (!loggedInClient) {
          set({ error: "Not logged in" });
          return [];
        }

        if (findCredentialAttempts >= maxFindCredentialAttempts) {
          set({ error: "Maximum credential search attempts reached" });
          return [];
        }

        try {
          set({ isFindingCredentials: true, error: null });
          console.log({ key: process.env.NEXT_PUBLIC_KRAKEN_ISSUER_PUBLIC_KEY });

          const credentials = await loggedInClient.filterCredentials({
            acceptedIssuers: [
              {
                authPublicKey: process.env.NEXT_PUBLIC_KRAKEN_ISSUER_PUBLIC_KEY!,
              },
            ],
          });

          set({
            credentials,
            isFindingCredentials: false,
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
        console.log({
          consumerEncryptionPublicKey: process.env.NEXT_PUBLIC_IDOS_ENCRYPTION_PUBLIC_KEY,
          consumerAuthPublicKey: process.env.NEXT_PUBLIC_IDOS_PUBLIC_KEY,
        });

        try {
          const sharedCredential = await loggedInClient.requestAccessGrant(credentialId, {
            consumerEncryptionPublicKey: process.env.NEXT_PUBLIC_IDOS_ENCRYPTION_PUBLIC_KEY,
            consumerAuthPublicKey: process.env.NEXT_PUBLIC_IDOS_PUBLIC_KEY,
          });
          return sharedCredential as any;
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Failed to share credential";
          set({ error: errorMessage });
          throw new Error(errorMessage);
        }
      },

      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),

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
