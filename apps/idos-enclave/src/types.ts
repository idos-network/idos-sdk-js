import type { Store } from "@idos-network/core";

export type UIMode = "new" | "existing" | "confirm";
export type AuthMethod = "password" | "passkey";
export type Theme = "dark" | "light";

export type idOSEnclaveConfiguration = {
  mode?: UIMode;
  theme?: Theme;
};

export type AllowedIntent = "password" | "confirm" | "auth" | "backupPasswordOrSecret";

export interface AuthMethodProps<K = Record<string, unknown>> {
  mode: UIMode;
  store: Store;
  onSuccess: (result: K) => void;
  onError: (error: Error) => void;
}
