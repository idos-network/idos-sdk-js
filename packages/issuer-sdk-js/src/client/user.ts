import { hasProfile as _hasProfile } from "@idos-network/core";

import type { IssuerConfig } from "./create-issuer-config";

export async function hasProfile(config: IssuerConfig, address: string) {
  const { kwilClient } = config;
  return _hasProfile(kwilClient, address);
}
