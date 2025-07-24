import type { VerifiableCredential, VerifiableCredentialSubject } from "@idos-network/consumer";
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { fetchSharedCredential } from "@/services/credentials";

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

  // Hifi
  signedAgreementId: string | null;

  // OnRamp URLs
  onRampUrl: string | null;
  hifiTosUrl: string | null;
  noahUrl: string | null;

  // Provider specific data
  transakToken: string | null;
  hifiTosId: string | null;
  onRampAccount: string | null;

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
  startProviderFlow: (userId: string, userAddress: string) => Promise<void>;

  // URL setters
  setKycUrl: (url: string | null) => void;
  setOnRampUrl: (url: string | null) => void;
  setHifiTosUrl: (url: string | null) => void;
  setNoahUrl: (url: string | null) => void;

  // Token/data setters
  setTransakToken: (token: string | null) => void;
  findTransakToken: (token: string | null) => void;
  setHifiTosId: (id: string | null) => void;
  setOnRampAccount: (account: string) => void;

  // Error handling
  setError: (message: string | null) => void;
  clearError: () => void;

  // Loading
  setLoading: (loading: boolean, message?: string) => void;

  // Reset
  reset: () => void;

  // Shared credential
  findSharedCredential: (userId: string) => void;

  // Hifi
  setHifiSignedAgreementId: (signedAgreementId: string) => void;
}

type AppStore = AppState & AppActions;

const initialState: AppState = {
  currentStep: "select-provider",
  selectedOnRampProvider: "hifi",
  selectedKyc: "persona",
  signedAgreementId: null,
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

      // Hifi
      setHifiSignedAgreementId: (signedAgreementId) => set({ signedAgreementId }),
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
        set({
          kycCompleted: true,
          currentStep: "provider-flow",
        });
      },

      findTransakToken: async (credentialId: string) => {
        const response = await fetch(`/api/kraken/transak-token?credentialId=${credentialId}`);
        if (!response.ok) throw new Error("Failed to get Transak token");
        const { token } = await response.json();
        set({ transakToken: token });
      },

      // Provider actions
      startProviderFlow: async (userId, userAddress) => {
        const { selectedOnRampProvider: selectedProvider, credentialId } = get();

        try {
          set({ isLoading: true, loadingMessage: "Starting provider flow..." });

          switch (selectedProvider) {
            case "hifi": {
              // Start with ToS for Hifi
              const { signedAgreementId, sharedCredential, credentialId } = get();
              if (!signedAgreementId) {
                const tosResponse = await fetch("/api/providers/hifi/tos");
                if (!tosResponse.ok) throw new Error("Failed to get Hifi ToS");
                const { link } = await tosResponse.json();
                window.location.href = link;
              }

              const userId = await fetch("/api/providers/hifi/user", {
                method: "POST",
                body: JSON.stringify({
                  signedAgreementId,
                  credentialId,
                  data: { credentialSubject: sharedCredential },
                  url: window.location.href,
                }),
              });
              break;
            }

            case "noah": {
              // Direct integration for Noah
              console.log("Starting Noah flow...");
              const { url } = await fetch(
                `/api/kyc/noah/link?userId=${userId}&credentialId=${credentialId}&address=${userAddress}`,
              ).then((res) => res.json());
              set({ onRampUrl: url });
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
        const maxAttempts = 20;
        const delayMs = 2000;

        set({
          isLoading: true,
          findCredentialAttempts: 0,
          loadingMessage: "Searching for shared credential...",
        });

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
          try {
            set({
              findCredentialAttempts: attempt,
              loadingMessage: `Searching for shared credential (attempt ${attempt} of ${maxAttempts})...`,
            });

            console.log(
              `Attempting to fetch shared credential for user ${userId} (attempt ${attempt}/${maxAttempts})`,
            );

            const response = await fetchSharedCredential(userId);

            // Check if we got valid credential data
            if (response.credentialContent && response.credentialId) {
              console.log(`Successfully found shared credential on attempt ${attempt}`);
              set({
                sharedCredential:
                  response.credentialContent as VerifiableCredential<VerifiableCredentialSubject>,
                credentialId: response.credentialId,
                isLoading: false,
                loadingMessage: null,
                hasExistingCredentials: true,
              });
              return;
            }

            // If no credential found but request was successful, continue trying
            console.log(`No credential found on attempt ${attempt}, will retry...`);
          } catch (error) {
            console.warn(
              `Attempt ${attempt} failed:`,
              error instanceof Error ? error.message : "Unknown error",
            );
          }

          // Wait before next attempt (except on the last attempt)
          if (attempt < maxAttempts) {
            await new Promise((resolve) => setTimeout(resolve, delayMs));
          }
        }

        // All attempts failed
        console.error(`Failed to fetch shared credential after ${maxAttempts} attempts`);
        set({
          isLoading: false,
          loadingMessage: null,
          hasExistingCredentials: false,
          errorMessage: `Failed to find shared credential after ${maxAttempts} attempts`,
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
