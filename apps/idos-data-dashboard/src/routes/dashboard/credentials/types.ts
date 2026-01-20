import type { idOSCredentialListItem } from "@idos-network/client";

export type idOSCredentialWithShares = idOSCredentialListItem & {
  shares: string[];
};
