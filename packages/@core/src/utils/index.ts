import type { AccessKeyList } from "@near-js/types";
import type { connect as ConnectType } from "near-api-js";
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

export async function getNearFullAccessPublicKeys(
  namedAddress: string,
  networkId = "testnet",
  nodeUrl = "https://rpc.testnet.near.org",
): Promise<string[] | undefined> {
  let connect: typeof ConnectType;
  try {
    connect = (await import("near-api-js")).connect;
  } catch (e) {
    throw new Error("Can't load near-api-js");
  }

  const connectionConfig = {
    networkId,
    nodeUrl,
  };
  const nearConnection = await connect(connectionConfig);

  try {
    const response: AccessKeyList = await nearConnection.connection.provider.query({
      request_type: "view_access_key_list",
      finality: "final",
      account_id: namedAddress,
    });
    return response.keys
      .filter((element) => element.access_key.permission === "FullAccess")
      ?.map((i) => i.public_key);
  } catch {
    // `Near` failed if namedAddress contains uppercase symbols
    return;
  }
}
