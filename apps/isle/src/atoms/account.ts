import { atom } from "jotai";

export type AccountStatus =
  | "disconnected"
  | "no profile"
  | "not verified"
  | "pending verification"
  | "verified"
  | "error";

interface AccountState {
  status: AccountStatus;
  error?: string;
}

const defaultState: AccountState = {
  status: "disconnected",
  error: undefined,
};

export const accountAtom = atom<AccountState>(defaultState);

// Derived atoms for individual values
export const statusAtom = atom(
  (get) => get(accountAtom).status,
  (get, set, status: AccountStatus) => set(accountAtom, { ...get(accountAtom), status }),
);

export const errorAtom = atom(
  (get) => get(accountAtom).error,
  (get, set, error: string | undefined) => set(accountAtom, { ...get(accountAtom), error }),
);

// Reset action
export const resetAccount = atom(null, (_get, set) => set(accountAtom, defaultState));
