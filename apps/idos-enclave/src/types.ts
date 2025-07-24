import type { Store } from "@idos-network/utils/store";

export type UIMode = "new" | "existing" | "confirm";
export type PasswordMethod = "user" | "passkey";
export type Theme = "dark" | "light";

export type idOSEnclaveConfiguration = {
  mode?: UIMode;
  theme?: Theme;
};

export type AllowedIntent =
  | "userPassword"
  | "confirm"
  | "choosePasswordMethod"
  | "backupPasswordOrSecret";

export interface PasswordSetProps<K = Record<string, unknown>> {
  mode: UIMode;
  store: Store;
  onSuccess: (result: K) => void;
  onError: (error: Error) => void;
}
