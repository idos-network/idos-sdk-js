import nacl from "tweetnacl";
import { base64Encode } from "../codecs";
import type { KwilActionClient } from "../kwil-infra";

// @ts-ignore
export async function getPassportingPeers(kwilClient: KwilActionClient, params: string[]) {
  return Promise.resolve(
    Array.from({ length: 10 }).map((i) => base64Encode(nacl.sign.keyPair().publicKey)),
  );
}
