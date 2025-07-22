import { idOSIssuer as _idOSIssuer } from "@idos-network/issuer";
import { base64Decode } from "@idos-network/utils/codecs";
import invariant from "tiny-invariant";
import nacl from "tweetnacl";

let issuer: _idOSIssuer | null = null;

export async function idOSIssuer() {
  if (issuer) {
    return issuer;
  }

  const NODE_URL = process.env.NEXT_PUBLIC_KWIL_NODE_URL;
  const ENCRYPTION_SECRET_KEY = process.env.ISSUER_ENCRYPTION_SECRET_KEY;
  const SIGNING_SECRET_KEY = process.env.ISSUER_SIGNING_SECRET_KEY;

  invariant(NODE_URL, "`NEXT_PUBLIC_KWIL_NODE_URL` is not set");
  invariant(ENCRYPTION_SECRET_KEY, "`ISSUER_ENCRYPTION_SECRET_KEY` is not set");
  invariant(SIGNING_SECRET_KEY, "`ISSUER_SIGNING_SECRET_KEY` is not set");

  issuer = await _idOSIssuer.init({
    nodeUrl: NODE_URL,
    signingKeyPair: nacl.sign.keyPair.fromSecretKey(base64Decode(SIGNING_SECRET_KEY)),
    encryptionSecretKey: base64Decode(ENCRYPTION_SECRET_KEY),
  });

  return issuer;
}
