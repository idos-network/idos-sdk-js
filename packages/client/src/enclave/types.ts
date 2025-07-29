import type { idOSCredential } from "@idos-network/credentials";
import type { PublicEncryptionProfile } from "@idos-network/utils/enclave";

// Request names that can be sent to the enclave
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

// Request data for each method
export interface EnclaveRequestData {
  load: {};
  reset: {};
  configure: {
    mode?: "new" | "existing";
    theme?: "light" | "dark";
    walletAddress?: string;
    userId?: string;
    encryptionPasswordStore?: string;
    expectedUserEncryptionPublicKey?: string;
  };
  confirm: {
    message: string;
  };
  filterCredentials: {
    credentials: idOSCredential[];
    privateFieldFilters: {
      pick: Record<string, unknown[]>;
      omit: Record<string, unknown[]>;
    };
  };
  encrypt: {
    message: Uint8Array;
    receiverPublicKey: Uint8Array;
  };
  decrypt: {
    fullMessage: Uint8Array;
    senderPublicKey: Uint8Array;
  };
  backupPasswordOrSecret: {};
  ensureUserEncryptionProfile: {};
  signTypedDataResponse: {
    signature: string;
  };
}

// Response types for each method
export interface EnclaveResponseData {
  load: void;
  reset: void;
  configure: void;
  confirm: boolean;
  filterCredentials: idOSCredential[];
  encrypt: {
    content: Uint8Array;
    encryptorPublicKey: Uint8Array;
  };
  decrypt: Uint8Array;
  backupPasswordOrSecret: void;
  ensureUserEncryptionProfile: PublicEncryptionProfile;
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
