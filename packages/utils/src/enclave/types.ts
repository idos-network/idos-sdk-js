export type EncryptionPasswordStore = "mpc" | "user";

export type UserEncryptionProfile = {
  userId: string;
  userEncryptionPublicKey: string;
  encryptionPasswordStore: EncryptionPasswordStore;
};

export type PrivateEncryptionProfile = {
  userId: string;
  password: string;
  keyPair: nacl.BoxKeyPair;
  encryptionPasswordStore: EncryptionPasswordStore;
};

export type EnclaveOptions = {
  theme?: "light" | "dark";
  mode?: "new" | "existing";
  userId?: string;
  expectedUserEncryptionPublicKey?: string;
  walletAddress?: string;
  encryptionPasswordStore?: EncryptionPasswordStore;
};

export type PasswordContext = {
  encryptionPasswordStore: "user";
  password: string;
  duration?: number;
};

export type MPCPasswordContext = {
  encryptionPasswordStore: "mpc";
};
