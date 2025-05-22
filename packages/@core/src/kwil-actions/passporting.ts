import type { KwilActionClient } from "../kwil-infra";
import type { PassportingPeer } from "../types";

export async function getPassportingPeers(
  kwilClient: KwilActionClient,
): Promise<PassportingPeer[]> {
  return kwilClient.call<PassportingPeer[]>({
    name: "passporting_peers",
    inputs: {},
  });
}
