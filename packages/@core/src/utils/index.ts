import invariant from "tiny-invariant";
import nacl from "tweetnacl";
import { base64Decode, base64Encode, hexEncode, utf8Encode } from "../codecs";
import type { InsertableIDOSCredential } from "../types";

export async function buildInsertableIDOSCredential(
  userId: string,
  publicNotes: string,
  content: string,
  recipientEncryptionPublicKey: string,
  encryptorPublicKey: string,
  grantInfo?: {
    consumerAddress: string;
    lockedUntil: number;
  },
): Promise<InsertableIDOSCredential> {
  invariant(recipientEncryptionPublicKey, "Missing `recipientEncryptionPublicKey`");
  invariant(encryptorPublicKey, "Missing `encryptorPublicKey`");

  const issuerAuthenticationKeyPair = nacl.sign.keyPair();

  const publicNotesSignature = nacl.sign.detached(
    utf8Encode(publicNotes),
    issuerAuthenticationKeyPair.secretKey,
  );

  const grantInfoParam = grantInfo
    ? {
        grantee_wallet_identifier: grantInfo.consumerAddress,
        locked_until: grantInfo.lockedUntil,
      }
    : {};

  return {
    user_id: userId,
    content,

    public_notes: publicNotes,
    public_notes_signature: base64Encode(publicNotesSignature),

    broader_signature: base64Encode(
      nacl.sign.detached(
        Uint8Array.from([...publicNotesSignature, ...base64Decode(content)]),
        issuerAuthenticationKeyPair.secretKey,
      ),
    ),

    issuer_auth_public_key: hexEncode(issuerAuthenticationKeyPair.publicKey, true),
    encryptor_public_key: encryptorPublicKey,
    ...grantInfoParam,
  };
}
