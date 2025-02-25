import { hasProfile } from "@idos-network/core";

import type { IssuerConfig } from "./create-issuer";

export async function checkUserProfile({ kwilClient }: IssuerConfig, address: string) {
  return hasProfile(kwilClient, address);
}
