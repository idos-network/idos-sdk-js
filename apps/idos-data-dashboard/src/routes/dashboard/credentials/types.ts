import type { idOSCredential } from "@idos-network/credentials";

export type idOSCredentialWithShares = idOSCredential & {
  shares: string[];
};
