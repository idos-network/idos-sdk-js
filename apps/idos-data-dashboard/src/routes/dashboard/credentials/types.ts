import type { idOSCredential } from "@idos-network/core";

export type idOSCredentialWithShares = idOSCredential & {
  shares: string[];
};
