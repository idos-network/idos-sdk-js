export type AuthMethod = "password" | "passkey";
export type UiMode = "new" | "existing";

export interface ParsedSearchParams {
  humanId: string;
  method: AuthMethod;
  mode: UiMode;
  pubKey: string;
}
