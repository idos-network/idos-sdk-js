import nacl from "tweetnacl";
import { base64Encode, hexEncode } from "../codecs";
import type { KwilActionClient } from "../kwil-infra";
import type { PassportingPeer } from "../types";

// @ts-ignore
export async function getPassportingPeers(
  kwilClient: KwilActionClient,
): Promise<PassportingPeer[]> {
  return kwilClient.call<PassportingPeer[]>({
    name: "passporting_peers",
    inputs: {},
  });
}
