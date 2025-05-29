import type { KwilActionClient } from "../kwil-infra";
import type { PassportingPeer } from "../types";

export async function getPassportingPeers(
  kwilClient: KwilActionClient,
): Promise<PassportingPeer[]> {
  return kwilClient.call<PassportingPeer[]>({
    name: "get_passporting_peers",
    inputs: {},
  });
}
