import nacl from "tweetnacl";
import { base64Encode, hexEncode } from "../codecs";
import type { KwilActionClient } from "../kwil-infra";
import type { PassportingPeer } from "../types";

// @ts-ignore
export async function getPassportingPeers(
  kwilClient: KwilActionClient,
  params: string[],
): Promise<PassportingPeer[]> {
  return Promise.resolve(
    Array.from({ length: 10 }).map(() => ({
      id: crypto.randomUUID(),
      name: "Passporting Peer",
      issuer_public_key: hexEncode(nacl.sign.keyPair().publicKey),
      passporting_server_url_base: "https://passporting-server.com",
    })),
  );
}
