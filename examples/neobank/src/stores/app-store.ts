import type { VerifiableCredential, VerifiableCredentialSubject } from "@idos-network/consumer";
import { create } from "zustand";
import { devtools } from "zustand/middleware";

export type OnRampProvider = "transak" | "noah" | "hifi" | null;
export type KycProvider = "sumsub" | "persona" | null;
export type FlowStep =
  | "select-provider"
  | "kyc-check"
  | "credential-check"
  | "select-kyc"
  | "kyc-flow"
  | "provider-flow"
  | "complete"
  | "error";

interface AppState {
  // Flow State
  currentStep: FlowStep;
  selectedOnRampProvider: OnRampProvider;
  selectedKyc: KycProvider;

  // Credential management
  hasExistingCredentials: boolean | null;
  credentialId: string | null;
  findCredentialAttempts: number;

  // KYC completion
  kycCompleted: boolean;

  // KYC URLs
  kycUrl: string | null;

  // OnRamp URLs
  onRampUrl: string | null;
  hifiTosUrl: string | null;
  noahUrl: string | null;

  // Provider specific data
  transakToken: string | null;
  hifiTosId: string | null;
  onRampAccount: any | null;

  // Error handling
  errorMessage: string | null;

  // Loading states
  isLoading: boolean;
  loadingMessage: string | null;

  sharedCredential: VerifiableCredential<VerifiableCredentialSubject> | null;
}

interface AppActions {
  // Flow control
  setCurrentStep: (step: FlowStep) => void;
  setOnRampProvider: (provider: OnRampProvider) => void;
  setKycProvider: (kyc: KycProvider) => void;

  // Credential actions
  setCredentialFound: (credentialId: string) => void;
  setNoCredentialsFound: () => void;

  // KYC actions
  startKyc: () => Promise<void>;
  completeKyc: () => void;

  // Provider actions
  startProviderFlow: () => Promise<void>;

  // URL setters
  setKycUrl: (url: string | null) => void;
  setOnRampUrl: (url: string | null) => void;
  setHifiTosUrl: (url: string | null) => void;
  setNoahUrl: (url: string | null) => void;

  // Token/data setters
  findTransakToken: (token: string | null) => void;
  setHifiTosId: (id: string | null) => void;
  setOnRampAccount: (account: any) => void;

  // Error handling
  setError: (message: string | null) => void;
  clearError: () => void;

  // Loading
  setLoading: (loading: boolean, message?: string) => void;

  // Reset
  reset: () => void;

  // Shared credential
  findSharedCredential: (userId: string) => void;
}

type AppStore = AppState & AppActions;

const initialState: AppState = {
  currentStep: "select-provider",
  selectedOnRampProvider: "transak",
  selectedKyc: "persona",
  hasExistingCredentials: null,
  credentialId: null,
  findCredentialAttempts: 0,
  kycUrl: null,
  onRampUrl: null,
  hifiTosUrl: null,
  noahUrl: null,
  transakToken: null,
  hifiTosId: null,
  onRampAccount: null,
  errorMessage: null,
  isLoading: false,
  loadingMessage: null,
  sharedCredential: null,
  kycCompleted: false,
};

export const useAppStore = create<AppStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // Flow control
      setCurrentStep: (step) => set({ currentStep: step }),

      setOnRampProvider: (provider) => {
        set({ selectedOnRampProvider: provider });
        // Auto-advance to credential check instead of KYC
        if (provider) {
          set({ currentStep: "credential-check" });
        }
      },

      setKycProvider: (kyc) => set({ selectedKyc: kyc }),

      setCredentialFound: (credentialId) => set({ credentialId: credentialId }),
      setNoCredentialsFound: () => set({ credentialId: null, hasExistingCredentials: false }),

      // KYC actions
      startKyc: async () => {
        try {
          set({ isLoading: true, loadingMessage: "Starting KYC process..." });
          const { selectedKyc } = get();

          const response = await fetch(`/api/kyc/link?type=${selectedKyc}`);
          if (!response.ok) {
            throw new Error("Failed to get KYC URL");
          }

          const { url } = await response.json();
          set({
            kycUrl: url,
            currentStep: "kyc-flow",
            isLoading: false,
            loadingMessage: null,
          });
        } catch (error) {
          set({
            errorMessage: error instanceof Error ? error.message : "Unknown error",
            currentStep: "error",
            isLoading: false,
            loadingMessage: null,
          });
        }
      },

      completeKyc: async () => {
        try {
          set({
            isLoading: true,
            loadingMessage: "KYC completed! Searching for your credential...",
            kycCompleted: true,
          });

          // Wait a moment for the credential to be processed
          await new Promise((resolve) => setTimeout(resolve, 2000));

          // Search for the newly created credential
          const response = await fetch("/api/credentials/check");
          if (response.ok) {
            const { hasCredentials, credentialId } = await response.json();
            if (hasCredentials && credentialId) {
              set({
                credentialId,
                hasExistingCredentials: true,
                currentStep: "provider-flow",
                kycUrl: null,
                isLoading: false,
                loadingMessage: null,
              });
              return;
            }
          }

          // If no credential found, proceed anyway but without credential ID
          console.warn("No credential found after KYC completion");
          set({
            currentStep: "provider-flow",
            kycUrl: null,
            isLoading: false,
            loadingMessage: null,
          });
        } catch (error) {
          console.error("Error finding credential after KYC:", error);
          // Proceed anyway to avoid blocking the flow
          set({
            currentStep: "provider-flow",
            kycUrl: null,
            isLoading: false,
            loadingMessage: null,
          });
        }
      },

      findTransakToken: async (credentialId: string) => {
        const response = await fetch(`/api/kraken/transak-token?credentialId=${credentialId}`);
        if (!response.ok) throw new Error("Failed to get Transak token");
        const { token } = await response.json();
        set({ transakToken: token });
      },

      // Provider actions
      startProviderFlow: async () => {
        const { selectedOnRampProvider: selectedProvider, credentialId } = get();

        try {
          set({ isLoading: true, loadingMessage: "Starting provider flow..." });

          switch (selectedProvider) {
            case "hifi": {
              // Start with ToS for Hifi
              const tosResponse = await fetch("/api/providers/hifi/tos");
              if (!tosResponse.ok) throw new Error("Failed to get Hifi ToS");
              const { link } = await tosResponse.json();
              set({ hifiTosUrl: link });
              break;
            }

            case "noah": {
              // Direct integration for Noah
              console.log("Starting Noah flow...");
              const noahResponse = await fetch("/api/providers/noah/link");
              if (!noahResponse.ok) throw new Error("Failed to get Noah URL");
              const { url } = await noahResponse.json();
              console.log("Noah URL received:", url);
              set({ noahUrl: url });
              break;
            }

            case "transak": {
              // Get sharable token for Transak (using existing credential if available)
              const transakUrl = credentialId
                ? `/api/providers/transak/token?credentialId=${credentialId}`
                : "/api/providers/transak/token";
              const transakResponse = await fetch(transakUrl);
              if (!transakResponse.ok) throw new Error("Failed to get Transak token");
              const { token } = await transakResponse.json();
              set({ transakToken: token });
              break;
            }
          }

          set({ isLoading: false, loadingMessage: null });
        } catch (error) {
          console.error("startProviderFlow error:", error);
          set({
            errorMessage: error instanceof Error ? error.message : "Unknown error",
            currentStep: "error",
            isLoading: false,
            loadingMessage: null,
          });
        }
      },

      // Shared credential
      findSharedCredential: async (userId: string) => {
        const response = await fetch(`/api/shared-credential?userId=${userId}`).then((res) =>
          res.json(),
        );
        set({
          sharedCredential:
            response.credentialContent as VerifiableCredential<VerifiableCredentialSubject>,
          credentialId: response.credentialId,
        });
      },

      // URL setters
      setKycUrl: (url) => set({ kycUrl: url }),
      setHifiTosUrl: (url) => set({ hifiTosUrl: url }),
      setNoahUrl: (url) => set({ noahUrl: url }),

      // Token/data setters
      setTransakToken: (token) => set({ transakToken: token }),
      setHifiTosId: (id) => set({ hifiTosId: id }),
      setOnRampAccount: (account) => set({ onRampAccount: account }),

      // Error handling
      setError: (message) => set({ errorMessage: message, currentStep: "error" }),
      clearError: () => set({ errorMessage: null }),

      // Loading
      setLoading: (loading, message) =>
        set({
          isLoading: loading,
          loadingMessage: message || null,
        }),

      // Reset
      reset: () => set(initialState),
    }),
    {
      name: "neobank-app-store",
    },
  ),
);
