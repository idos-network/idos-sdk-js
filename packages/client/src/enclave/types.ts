import type { idOSCredential } from "@idos-network/core";

export type StoredData = {
  encryptionPublicKey?: Uint8Array;
  userId?: string;
};

export type DiscoverUserEncryptionPublicKeyResponse = {
  userId: string;
  userEncryptionPublicKey: string;
};

export type EnclaveOptions = {
  container: string;
  theme?: "light" | "dark";
  mode?: "new" | "existing";
  url?: string;
  throwOnUserCancelUnlock?: boolean;
};

export interface EnclaveProvider {
  load(): Promise<void>;
  reconfigure(options: Omit<EnclaveOptions, "container" | "url">): Promise<void>;

  ready(userId: string, currentUserEncryptionPublicKey?: string): Promise<Uint8Array>;
  reset(): Promise<void>;
  confirm(message: string): Promise<boolean>;
  encrypt(
    message: Uint8Array,
    receiverPublicKey?: Uint8Array,
  ): Promise<{ content: Uint8Array; encryptorPublicKey: Uint8Array }>;
  decrypt(message: Uint8Array, senderPublicKey?: Uint8Array): Promise<Uint8Array>;
  discoverUserEncryptionPublicKey(userId: string): Promise<DiscoverUserEncryptionPublicKeyResponse>;

  filterCredentials(
    credentials: idOSCredential[],
    privateFieldFilters: {
      pick: Record<string, unknown[]>;
      omit: Record<string, unknown[]>;
    },
  ): Promise<idOSCredential[]>;

  backupPasswordOrSecret(): Promise<void>;
}
