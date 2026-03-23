import type { idOSCredentialListItem } from "@idos-network/client";
import type { idOSGrant } from "@idos-network/kwil-infra/actions";

export type idOSCredentialWithShares = idOSCredentialListItem & {
  shares: string[];
};

export type SharedGrant = {
  grant: idOSGrant;
  credential: {
    id: string;
    originalId: string;
    publicNotes: Record<string, unknown>;
  } | null;
};
