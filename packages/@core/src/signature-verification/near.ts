import { bs58Decode, hexDecode, sha256Hash } from "@idos-network/utils/codecs";
import { deserialize as borshDeserialize, serialize as borshSerialize } from "borsh";
import nacl from "tweetnacl";

interface NEP413Payload {
  tag: number;
  message: string;
  nonce: number[];
  recipient: string;
  callbackUrl?: string;
}

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

    // Deserialize the payload to extract nonce, recipient, callbackUrl
    const payloadSchema = {
      struct: {
        tag: "u32",
        message: "string",
        nonce: { array: { type: "u8", len: 32 } },
        recipient: "string",
        callbackUrl: { option: "string" },
      },
    };

    const deserializedPayload = borshDeserialize(payloadSchema, payloadBytes) as NEP413Payload;

    // Reconstruct the payload with tag and message (matching Go implementation)
    const reconstructedPayload: NEP413Payload = {
      tag: 2147484061, // 2**31 + 413
      message: message, // Use the provided message
      nonce: deserializedPayload.nonce,
      recipient: deserializedPayload.recipient,
      callbackUrl: deserializedPayload.callbackUrl,
    };

    // Serialize the entire payload (matching Go's borsch.Serialize(*payload))
    const fullPayloadBytes = borshSerialize(payloadSchema, reconstructedPayload);

    // Hash the payload (matching Go's sha256.Sum256(payloadBytes))
    const hash = sha256Hash(fullPayloadBytes);

    // Raw ed25519 verification using nacl (matching Go's ed25519.Verify)
    const isValid = nacl.sign.detached.verify(hash, actualSignature, publicKeyBytes);

    return isValid;
  } catch (error) {
    console.warn("NEAR signature verification failed:", error);
    return false;
  }
};
