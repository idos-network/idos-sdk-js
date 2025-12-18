import type { idOSCredential } from "@idos-network/credentials/types";

export type idOSCredentialWithShares = idOSCredential & {
  shares: string[];
};
