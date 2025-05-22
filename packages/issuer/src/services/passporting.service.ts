import type { KwilActionClient, PassportingPeer } from "@idos-network/core";
import { getPassportingPeers } from "@idos-network/core/kwil-actions";

export class PassportingService {
  constructor(private readonly kwilClient: KwilActionClient) {}

  /**
   * Return a list of public keys of the known passporting peers for the given `Signer`.
   */
  async getPassportingPeers(): Promise<PassportingPeer[]> {
    return getPassportingPeers(this.kwilClient);
  }
}
