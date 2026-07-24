import { KwilSigner } from "@idos-network/kwil-js";
import { base64UrlDecode, utf8Decode, utf8Encode } from "@idos-network/utils/codecs";

const ED25519_PUBLIC_KEY_BYTES = 32;
const ED25519_SIGNATURE_BYTES = 64;

export interface MmTokenEnvelope {
  token: string;
  signature: string;
}

interface MmTokenPayload {
  signing_public_key: string;
}

function isMmTokenEnvelope(value: unknown): value is MmTokenEnvelope {
  return (
    value !== null &&
    typeof value === "object" &&
    "token" in value &&
    typeof value.token === "string" &&
    "signature" in value &&
    typeof value.signature === "string"
  );
}

function parseJson<T>(bytes: Uint8Array, errorMessage: string): T {
  try {
    return JSON.parse(utf8Decode(bytes)) as T;
  } catch (error) {
    throw new Error(errorMessage, { cause: error });
  }
}

function decodeBase64Url(value: string, errorMessage: string): Uint8Array {
  try {
    return base64UrlDecode(value);
  } catch (error) {
    throw new Error(errorMessage, { cause: error });
  }
}

export function createMmTokenKwilSigner(envelope: string | MmTokenEnvelope): KwilSigner {
  const envelopeBytes =
    typeof envelope === "string" ? utf8Encode(envelope) : utf8Encode(JSON.stringify(envelope));
  const parsedEnvelope =
    typeof envelope === "string"
      ? parseJson<unknown>(envelopeBytes, "Invalid mm_token envelope JSON")
      : envelope;

  if (!isMmTokenEnvelope(parsedEnvelope)) {
    throw new Error("Invalid mm_token envelope: expected token and signature strings");
  }

  const tokenSignatureBytes = decodeBase64Url(
    parsedEnvelope.signature,
    "Invalid mm_token envelope signature encoding",
  );
  if (tokenSignatureBytes.length !== ED25519_SIGNATURE_BYTES) {
    throw new Error(
      `Invalid mm_token signature length: expected ${ED25519_SIGNATURE_BYTES}, got ${tokenSignatureBytes.length}`,
    );
  }

  const tokenBytes = decodeBase64Url(
    parsedEnvelope.token,
    "Invalid mm_token envelope token encoding",
  );
  const token = parseJson<Partial<MmTokenPayload>>(tokenBytes, "Invalid mm_token token JSON");

  if (typeof token.signing_public_key !== "string") {
    throw new Error("Invalid mm_token token: missing signing_public_key");
  }

  const signingPublicKeyBytes = decodeBase64Url(
    token.signing_public_key,
    "Invalid mm_token signing_public_key encoding",
  );

  if (signingPublicKeyBytes.length !== ED25519_PUBLIC_KEY_BYTES) {
    throw new Error(
      `Invalid mm_token signing_public_key length: expected ${ED25519_PUBLIC_KEY_BYTES}, got ${signingPublicKeyBytes.length}`,
    );
  }

  return new KwilSigner(async () => envelopeBytes.slice(), signingPublicKeyBytes, "mm_token");
}
