import type { idOSCredential } from "@idos-network/idos-sdk-types";
import type { BackupPasswordInfo } from "../types";

export interface StoredData {
  userEncryptionPublicKey?: Uint8Array;
  humanId?: string;
  signerAddress?: string;
  signerEncryptionPublicKey?: string;
}

export interface DiscoverUserEncryptionPublicKeyResponse {
  humanId: string;
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
  load(): Promise<StoredData>;

  ready(
    humanId?: string,
    signerAddress?: string,
    signerEncryptionPublicKey?: string,
    currentUserEncryptionPublicKey?: string,
  ): Promise<Uint8Array>;
  store(key: string, value: string): Promise<string>;
  reset(): Promise<void>;
  confirm(message: string): Promise<boolean>;
  updateStore(key: string, value: unknown): Promise<void>;
  encrypt(
    message: Uint8Array,
    recipientEncryptionPublicKey?: Uint8Array,
  ): Promise<{ content: Uint8Array; encryptorPublicKey: Uint8Array }>;
  decrypt(message: Uint8Array, senderEncryptionPublicKey?: Uint8Array): Promise<Uint8Array>;
  discoverUserEncryptionPublicKey(
    humanId: string,
  ): Promise<DiscoverUserEncryptionPublicKeyResponse>;
  filterCredentialsByCountries(
    credentials: Record<string, string>[],
    countries: string[],
  ): Promise<string[]>;

  filterCredentials(
    credentials: Record<string, string>[],
    privateFieldFilters: {
      pick: Record<string, string>;
      omit: Record<string, string>;
    },
  ): Promise<idOSCredential[]>;

  backupPasswordOrSecret(
    callbackFn: (response: BackupPasswordInfo) => Promise<void>,
  ): Promise<void>;
}
