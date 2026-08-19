import { KwilSigner } from "@idos-network/kwil-js";
import { createUkycContentUri } from "@idos-network/utils/blob-gateway";
import {
  base64UrlDecode,
  base64UrlEncode,
  utf8Decode,
  utf8Encode,
} from "@idos-network/utils/codecs";

const ED25519_PUBLIC_KEY_BYTES = 32;
const ED25519_SIGNATURE_BYTES = 64;

/** Decoded UKYC capability envelope. KGW signature data is base64url(JSON of this). */
export interface MmTokenEnvelope {
  payload: MmTokenPayload | Record<string, unknown>;
  signature: string;
}

export interface MmTokenPayload {
  signing_public_key: string;
  storage_id?: string;
  [key: string]: unknown;
}

export type MmTokenKwilSigner = KwilSigner & {
  readonly mmTokenPayload: MmTokenPayload | Record<string, unknown>;
};

/** `storage_id` from the capability token used to construct this signer. */
export function mmTokenStorageId(signer: KwilSigner): string {
  const storageId = (signer as Partial<MmTokenKwilSigner>).mmTokenPayload?.storage_id;
  if (typeof storageId !== "string" || !storageId.trim()) {
    throw new Error("mm_token payload is missing storage_id");
  }
  return storageId.trim();
}

export function mmTokenCredentialContentUri(signer: KwilSigner, credentialId: string): string {
  return createUkycContentUri(mmTokenStorageId(signer), credentialId);
}

function isMmTokenEnvelope(value: unknown): value is MmTokenEnvelope {
  return (
    value !== null &&
    typeof value === "object" &&
    "payload" in value &&
    value.payload !== null &&
    typeof value.payload === "object" &&
    !Array.isArray(value.payload) &&
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

/**
 * Build a KwilSigner for KGW `mm_token` auth.
 *
 * Pass the MetaMask-issued capability token as a **base64url-encoded** envelope string
 * (what KGW verifies). A decoded `{ payload, signature }` object is also accepted and
 * will be re-encoded.
 *
 * `signMessage` always returns the UTF-8 bytes of that encoded string — KGW ignores the
 * request message and only verifies the envelope.
 */
export function createMmTokenKwilSigner(
  encodedEnvelope: string | MmTokenEnvelope,
): MmTokenKwilSigner {
  let signatureData: Uint8Array;
  let envelope: MmTokenEnvelope;

  if (typeof encodedEnvelope === "string") {
    const trimmed = encodedEnvelope.trim();
    if (!trimmed) {
      throw new Error("Invalid mm_token envelope: empty");
    }
    // KGW Verify receives UTF-8 of the base64url string, not the decoded JSON bytes.
    signatureData = utf8Encode(trimmed);
    const envelopeBytes = decodeBase64Url(trimmed, "Invalid mm_token envelope encoding");
    const parsed = parseJson<unknown>(envelopeBytes, "Invalid mm_token envelope JSON");
    if (!isMmTokenEnvelope(parsed)) {
      throw new Error("Invalid mm_token envelope: expected payload object and signature string");
    }
    envelope = parsed;
  } else {
    if (!isMmTokenEnvelope(encodedEnvelope)) {
      throw new Error("Invalid mm_token envelope: expected payload object and signature string");
    }
    envelope = encodedEnvelope;
    signatureData = utf8Encode(base64UrlEncode(utf8Encode(JSON.stringify(envelope))));
  }

  const tokenSignatureBytes = decodeBase64Url(
    envelope.signature,
    "Invalid mm_token envelope signature encoding",
  );
  if (tokenSignatureBytes.length !== ED25519_SIGNATURE_BYTES) {
    throw new Error(
      `Invalid mm_token signature length: expected ${ED25519_SIGNATURE_BYTES}, got ${tokenSignatureBytes.length}`,
    );
  }

  const signingPublicKey = envelope.payload.signing_public_key;
  if (typeof signingPublicKey !== "string") {
    throw new Error("Invalid mm_token payload: missing signing_public_key");
  }

  const signingPublicKeyBytes = decodeBase64Url(
    signingPublicKey,
    "Invalid mm_token signing_public_key encoding",
  );

  if (signingPublicKeyBytes.length !== ED25519_PUBLIC_KEY_BYTES) {
    throw new Error(
      `Invalid mm_token signing_public_key length: expected ${ED25519_PUBLIC_KEY_BYTES}, got ${signingPublicKeyBytes.length}`,
    );
  }

  return Object.assign(
    new KwilSigner(async () => signatureData.slice(), signingPublicKeyBytes, "mm_token"),
    { mmTokenPayload: envelope.payload },
  );
}
