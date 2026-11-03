import { bs58Decode, hexDecode } from "@idos-network/utils/codecs";
import nacl from "tweetnacl";

import { deserializeKwilNep413, nep413SignHash } from "./nep413";

// Must match the recipient the idOS node accepts for NEP-413 wallet signatures.
const NEP413_RECIPIENT = "idos.network";

export const verifyNearSignature = async (
  message: string,
  signature: string,
  publicKey: string,
): Promise<boolean> => {
  try {
    // Parse the NEAR public key format: "ed25519:base58_encoded_key"
    const pieces = publicKey.split(":");
    if (pieces.length !== 2 || pieces[0] !== "ed25519") {
      console.warn("Invalid NEAR public key format:", publicKey);
      return false;
    }

    // Extract raw public key bytes (am trying to match the logic I did in Backend)
    const publicKeyBytes = bs58Decode(pieces[1]);
    if (publicKeyBytes.length !== 32) {
      console.warn("Invalid NEAR public key length:", publicKeyBytes.length);
      return false;
    }

    // Decode the signature from hex
    const signatureBytes = hexDecode(signature);

    // Deserialize the signature (matching Go's deserializeSignature)
    const payloadLength = new DataView(signatureBytes.buffer).getUint16(0, false);
    const payloadBytes = signatureBytes.slice(2, 2 + payloadLength);
    const actualSignature = signatureBytes.slice(2 + payloadLength);

    if (actualSignature.length !== 64) {
      console.warn("Invalid signature length:", actualSignature.length);
      return false;
    }

    const deserializedPayload = deserializeKwilNep413(payloadBytes);

    // NEP-413 binds the signature to a relying party; reject ones addressed elsewhere.
    if (deserializedPayload.recipient !== NEP413_RECIPIENT) {
      console.warn("Invalid NEP-413 recipient");
      return false;
    }

    // Hash the caller-supplied message with the nonce and recipient from the envelope.
    const hash = nep413SignHash({
      message,
      nonce: deserializedPayload.nonce,
      recipient: deserializedPayload.recipient,
      callbackUrl: deserializedPayload.callbackUrl,
    });
    const isValid = nacl.sign.detached.verify(hash, actualSignature, publicKeyBytes);

    return isValid;
  } catch (error) {
    console.warn("NEAR signature verification failed:", error);
    return false;
  }
};
