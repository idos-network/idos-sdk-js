import type { idOSCredential } from "@idos-network/core";

export interface StoredData {
  encryptionPublicKey?: Uint8Array;
  userId?: string;
  signerAddress?: string;
  signerPublicKey?: string;
}

export interface DiscoverUserEncryptionPublicKeyResponse {
  userId: string;
  userEncryptionPublicKey: string;
}

export interface EnclaveOptions {
  container: string;
  theme?: "light" | "dark";
  mode?: "new" | "existing";
  url?: string;
  throwOnUserCancelUnlock?: boolean;
}

export interface EnclaveProvider {
  load(): Promise<void>;

  ready(
    userId?: string,
    signerAddress?: string,
    signerPublicKey?: string,
    currentUserEncryptionPublicKey?: string,
  ): Promise<Uint8Array>;
  reset(): Promise<void>;
  confirm(message: string): Promise<boolean>;
  encrypt(
    message: Uint8Array,
    receiverPublicKey?: Uint8Array,
  ): Promise<{ content: Uint8Array; encryptorPublicKey: Uint8Array }>;
  decrypt(message: Uint8Array, senderPublicKey?: Uint8Array): Promise<Uint8Array>;
  discoverUserEncryptionPublicKey(userId: string): Promise<DiscoverUserEncryptionPublicKeyResponse>;

  filterCredentials(
    credentials: Record<string, string>[],
    privateFieldFilters: {
      pick: Record<string, string>;
      omit: Record<string, string>;
    },
  ): Promise<idOSCredential[]>;

  backupPasswordOrSecret(): Promise<void>;
}
