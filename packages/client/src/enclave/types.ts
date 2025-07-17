export type StoredData = {
  encryptionPublicKey?: Uint8Array;
  userId?: string;
};

export type DiscoverUserEncryptionPublicKeyResponse = {
  userId: string;
  userEncryptionPublicKey: string;
};

export type EnclaveOptions = {
  theme?: "light" | "dark";
  mode?: "new" | "existing";
  walletAddress?: string;
};
