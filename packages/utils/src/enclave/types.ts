import { z } from "zod";

export const EncryptionPasswordStoresEnum: z.ZodEnum<["mpc", "user"]> = z.enum([
  "mpc",
  "user",
] as const);
export type EncryptionPasswordStore = z.infer<typeof EncryptionPasswordStoresEnum>;

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
