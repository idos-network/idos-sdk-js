import type { idOSCredential } from "@idos-network/credentials";

export type StoredData = {
  encryptionPublicKey?: Uint8Array;
  userId?: string;
  encryptionPasswordStore?: string;
};

export type UserEncryptionProfileResponse = {
  userId: string;
  userEncryptionPublicKey: string;
  encryptionPasswordStore: string;
};

export type EnclaveOptions = {
  container: string;
  theme?: "light" | "dark";
  mode?: "new" | "existing";
  url?: string;
  throwOnUserCancelUnlock?: boolean;
  walletAddress?: string;
};

export interface EnclaveProvider {
  load(walletAddress?: string): Promise<void>;
  reconfigure(options: Omit<EnclaveOptions, "container" | "url">): Promise<void>;

  ready(
    userId: string,
    currentUserEncryptionPublicKey?: string,
    encryptionPasswordStore?: string,
  ): Promise<{ userEncryptionPublicKey: Uint8Array; encryptionPasswordStore: string }>;
  reset(): Promise<void>;
  confirm(message: string): Promise<boolean>;
  encrypt(
    message: Uint8Array,
    receiverPublicKey?: Uint8Array,
  ): Promise<{ content: Uint8Array; encryptorPublicKey: Uint8Array }>;
  decrypt(message: Uint8Array, senderPublicKey?: Uint8Array): Promise<Uint8Array>;
  createUserEncryptionProfile(userId: string): Promise<UserEncryptionProfileResponse>;

  filterCredentials(
    credentials: idOSCredential[],
    privateFieldFilters: {
      pick: Record<string, unknown[]>;
      omit: Record<string, unknown[]>;
    },
  ): Promise<idOSCredential[]>;

  backupPasswordOrSecret(): Promise<void>;
}
