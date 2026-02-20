import { hexDecode, utf8Encode } from "@idos-network/utils/codecs";
import nacl from "tweetnacl";

export const verifyFaceSignSignature = (
  message: string,
  signature: string,
  publicKey: string,
): boolean => {
  try {
    return nacl.sign.detached.verify(utf8Encode(message), hexDecode(signature), hexDecode(publicKey));
  } catch (error) {
    console.warn("FaceSign signature verification failed:", error);
    return false;
  }
};
