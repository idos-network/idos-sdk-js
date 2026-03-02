import { hexDecode, utf8Encode } from "@idos-network/utils/codecs";
import nacl from "tweetnacl";

export const verifyFaceSignSignature = (
  message: string,
  signature: string,
  publicKey: string,
): boolean => {
  return nacl.sign.detached.verify(utf8Encode(message), hexDecode(signature), hexDecode(publicKey));
};
