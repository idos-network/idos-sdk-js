import type { BackupPasswordInfo, idOSCredential } from "../types";

export interface StoredData {
  encryptionPublicKey?: Uint8Array;
  humanId?: string;
  signerAddress?: string;
  signerPublicKey?: string;
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
    signerPublicKey?: string,
    currentUserPublicKey?: string,
  ): Promise<Uint8Array>;
  store(key: string, value: string): Promise<string>;
  reset(): Promise<void>;
  confirm(message: string): Promise<boolean>;
  updateStore(key: string, value: unknown): Promise<void>;
  encrypt(message: Uint8Array, receiverPublicKey?: Uint8Array): Promise<Uint8Array>;
  decrypt(message: Uint8Array, senderPublicKey?: Uint8Array): Promise<Uint8Array>;

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
