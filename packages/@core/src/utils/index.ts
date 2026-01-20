import type { InsertableIDOSCredential } from "@idos-network/credentials/types";
import { base64Decode, base64Encode, hexEncode, utf8Encode } from "@idos-network/utils/codecs";
import invariant from "tiny-invariant";
import nacl from "tweetnacl";

export async function buildInsertableIDOSCredential(
  userId: string,
  publicNotes: string,
  content: string,
  recipientEncryptionPublicKey: string,
  encryptorPublicKey: string,
): Promise<InsertableIDOSCredential> {
  invariant(recipientEncryptionPublicKey, "Missing `recipientEncryptionPublicKey`");
  invariant(encryptorPublicKey, "Missing `encryptorPublicKey`");

  const ephemeralAuthenticationKeyPair = nacl.sign.keyPair();

  const publicNotesSignature = nacl.sign.detached(
    utf8Encode(publicNotes),
    ephemeralAuthenticationKeyPair.secretKey,
  );

  return {
    user_id: userId,
    content,

    public_notes: publicNotes,
    public_notes_signature: base64Encode(publicNotesSignature),

    broader_signature: base64Encode(
      nacl.sign.detached(
        Uint8Array.from([...publicNotesSignature, ...base64Decode(content)]),
        ephemeralAuthenticationKeyPair.secretKey,
      ),
    ),

    issuer_auth_public_key: hexEncode(ephemeralAuthenticationKeyPair.publicKey, true),
    encryptor_public_key: encryptorPublicKey,
  };
}
