import { z } from "zod";

export const EncryptionPasswordStoresEnum: z.ZodEnum<{
  mpc: "mpc";
  user: "user";
}> = z.enum(["mpc", "user"]);

export type EncryptionPasswordStore = z.infer<typeof EncryptionPasswordStoresEnum>;

export type WalletType = "evm" | "near" | "xrpl" | "stellar";

// biome-ignore lint/suspicious/noExplicitAny: Wallet is a generic type that can be any wallet implementation
export type Wallet = any;

export type PublicEncryptionProfile = {
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
  walletPublicKey?: string;
  walletType?: string;
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
