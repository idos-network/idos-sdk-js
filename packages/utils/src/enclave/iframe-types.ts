import type { idOSCredential } from "@idos-network/credentials";
import type { BaseProvider } from "./base";
import type { PublicEncryptionProfile } from "./types";

/**
 * Iframe Enclave Communication Types
 *
 * These types define the communication protocol between the iframe-enclave client
 * and the enclave iframe. The types are derived from BaseProvider method signatures
 * to ensure consistency and type safety.
 *
 * The BaseProvider defines the actual method implementations, while these types
 * define how those methods are called via iframe message passing.
 */

// Extract method names from BaseProvider that can be called via iframe
export type EnclaveRequestName =
  | "load"
  | "reset"
  | "configure"
  | "confirm"
  | "filterCredentials"
  | "encrypt"
  | "decrypt"
  | "backupPasswordOrSecret"
  | "ensureUserEncryptionProfile"
  | "signTypedDataResponse";

// Type that maps BaseProvider method signatures to iframe request format
type BaseProviderToIframeRequest<T extends keyof BaseProvider> = T extends "load"
  ? {}
  : T extends "reset"
    ? {}
    : T extends "confirm"
      ? { message: string }
      : T extends "filterCredentials"
        ? {
            credentials: idOSCredential[];
            privateFieldFilters: {
              pick: Record<string, unknown[]>;
              omit: Record<string, unknown[]>;
            };
          }
        : T extends "encrypt"
          ? { message: Uint8Array; receiverPublicKey: Uint8Array }
          : T extends "decrypt"
            ? { fullMessage: Uint8Array; senderPublicKey: Uint8Array }
            : T extends "backupPasswordOrSecret"
              ? {}
              : T extends "ensureUserEncryptionProfile"
                ? {}
                : never;

// Type that maps BaseProvider method return types to iframe response format
type BaseProviderToIframeResponse<T extends keyof BaseProvider> = T extends "load"
  ? void
  : T extends "reset"
    ? void
    : T extends "confirm"
      ? boolean
      : T extends "filterCredentials"
        ? idOSCredential[]
        : T extends "encrypt"
          ? { content: Uint8Array; encryptorPublicKey: Uint8Array }
          : T extends "decrypt"
            ? Uint8Array
            : T extends "backupPasswordOrSecret"
              ? void
              : T extends "ensureUserEncryptionProfile"
                ? PublicEncryptionProfile
                : never;

// Request data for each method - derived from BaseProvider method signatures
export interface EnclaveRequestData {
  load: BaseProviderToIframeRequest<"load">;
  reset: BaseProviderToIframeRequest<"reset">;
  configure: {
    mode?: "new" | "existing";
    theme?: "light" | "dark";
    walletAddress?: string;
    userId?: string;
    encryptionPasswordStore?: string;
    expectedUserEncryptionPublicKey?: string;
  };
  confirm: BaseProviderToIframeRequest<"confirm">;
  filterCredentials: BaseProviderToIframeRequest<"filterCredentials">;
  encrypt: BaseProviderToIframeRequest<"encrypt">;
  decrypt: BaseProviderToIframeRequest<"decrypt">;
  backupPasswordOrSecret: BaseProviderToIframeRequest<"backupPasswordOrSecret">;
  ensureUserEncryptionProfile: BaseProviderToIframeRequest<"ensureUserEncryptionProfile">;
  signTypedDataResponse: {
    signature: string;
  };
}

// Response types for each method - derived from BaseProvider return types
export interface EnclaveResponseData {
  load: BaseProviderToIframeResponse<"load">;
  reset: BaseProviderToIframeResponse<"reset">;
  configure: void;
  confirm: BaseProviderToIframeResponse<"confirm">;
  filterCredentials: BaseProviderToIframeResponse<"filterCredentials">;
  encrypt: BaseProviderToIframeResponse<"encrypt">;
  decrypt: BaseProviderToIframeResponse<"decrypt">;
  backupPasswordOrSecret: BaseProviderToIframeResponse<"backupPasswordOrSecret">;
  ensureUserEncryptionProfile: BaseProviderToIframeResponse<"ensureUserEncryptionProfile">;
  signTypedDataResponse: void;
}

// Helper type for creating a request
export type CreateEnclaveRequest<T extends EnclaveRequestName> = {
  [K in T]: EnclaveRequestData[K];
};

// Helper type for getting response type
export type EnclaveResponse<T extends EnclaveRequestName> = EnclaveResponseData[T];

// Type-safe request function signature
export type EnclaveRequestFunction = <T extends EnclaveRequestName>(
  request: CreateEnclaveRequest<T>,
) => Promise<EnclaveResponse<T>>;
