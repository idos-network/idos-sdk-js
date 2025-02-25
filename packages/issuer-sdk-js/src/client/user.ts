import { hasProfile } from "@idos-network/core";

import type { IssuerConfig } from "./create-issuer-config";

export async function checkUserProfile({ kwilClient }: IssuerConfig, address: string) {
  return hasProfile(kwilClient, address);
}
