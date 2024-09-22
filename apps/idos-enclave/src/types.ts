export type AuthMethod = "password" | "passkey";
export type UiMode = "new" | "existing";

export interface ParsedSearchParams {
  humanId: string;
  method: AuthMethod;
  mode: UiMode;
  pubKey: string;
}

export type MessageEventDataType =
  | "secure-enclave:load"
  | "secure-enclave:auth"
  | "storage:get"
  | "storage:set"
  | "keypair:get"
  | "public-key:get";
