import type { KwilActionClient } from "@idos-network/kwil-infra";
import { getPassportingPeers, type idOSPassportingPeer } from "@idos-network/kwil-infra/actions";

export class PassportingService {
  constructor(private readonly kwilClient: KwilActionClient) {}

  /**
   * Return a list of public keys of the known passporting peers for the given `Signer`.
   */
  async getPassportingPeers(): Promise<idOSPassportingPeer[]> {
    return getPassportingPeers(this.kwilClient);
  }
}
