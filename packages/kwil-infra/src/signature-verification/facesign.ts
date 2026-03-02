import { hexDecode } from "@idos-network/utils/codecs";
import nacl from "tweetnacl";

export const verifyFaceSignSignature = (
  message: string,
  signature: string,
  publicKey: string,
): boolean => {
  return nacl.sign.detached.verify(
    new TextEncoder().encode(message),
    hexDecode(signature),
    hexDecode(publicKey),
  );
};
