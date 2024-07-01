import type { idOSCredential } from "@idos-network/idos-sdk";

export type idOSCredentialWithShares = idOSCredential & {
  shares: string[];
};
