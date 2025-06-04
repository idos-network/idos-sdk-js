import { create } from "zustand";

export interface OnboardingState {
  claimedSuccess: boolean;
}

export interface OnboardingActions {
  setClaimedSuccess: (claimed: boolean) => void;
  resetOnboarding: () => void;
}

export type OnboardingStore = OnboardingState & OnboardingActions;

const initialState: OnboardingState = {
  claimedSuccess: false,
};

export const useOnboardingStore = create<OnboardingStore>((set) => ({
  ...initialState,
  setClaimedSuccess: (claimedSuccess) => set({ claimedSuccess }),
  resetOnboarding: () => set(initialState),
}));
