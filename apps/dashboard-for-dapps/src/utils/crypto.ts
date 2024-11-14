import * as Base64Codec from "@stablelib/base64";
import * as Utf8Codec from "@stablelib/utf8";
import nacl from "tweetnacl";

export async function decrypt(
  b64FullMessage: string,
  b64SenderPublicKey: string,
  secretKey: string,
) {
  const fullMessage = Base64Codec.decode(b64FullMessage);
  const senderPublicKey = Base64Codec.decode(b64SenderPublicKey);

  const nonce = fullMessage.slice(0, nacl.box.nonceLength);
  const message = fullMessage.slice(nacl.box.nonceLength, fullMessage.length);

  const decrypted = nacl.box.open(message, nonce, senderPublicKey, Base64Codec.decode(secretKey));

  if (decrypted == null) {
    return "";
  }

  return Utf8Codec.decode(decrypted);
}
