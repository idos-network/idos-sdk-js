import type { Store } from "@idos-network/utils/store";

export type UIMode = "new" | "existing" | "confirm";
export type Theme = "dark" | "light";

export type idOSEnclaveConfiguration = {
  mode?: UIMode;
  theme?: Theme;
};

export type AllowedIntent = "confirm" | "getPasswordContext" | "backupPasswordContext";

export interface AuthMethodProps<K = Record<string, unknown>> {
  mode: UIMode;
  store: Store;
  onSuccess: (result: K) => void;
  onError: (error: Error) => void;
}
