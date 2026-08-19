import { base64UrlEncode, utf8Encode } from "@idos-network/utils/codecs";
import { describe, expect, it } from "vitest";

import {
  createMmTokenKwilSigner,
  mmTokenCredentialContentUri,
  mmTokenStorageId,
  type MmTokenEnvelope,
} from "./create-mm-token-kwil-signer.js";

const signingPublicKeyBytes = new Uint8Array(Array.from({ length: 32 }, (_, index) => index + 1));
const signatureBytes = new Uint8Array(Array.from({ length: 64 }, (_, index) => index + 64));

function createEnvelope(overrides: Partial<MmTokenEnvelope> = {}): MmTokenEnvelope {
  return {
    payload: {
      version: 1,
      aud: ["metamask:user-storage:ukyc", "idos:kwil"],
      signing_public_key: base64UrlEncode(signingPublicKeyBytes),
      storage_id: "storage-abc",
    },
    signature: base64UrlEncode(signatureBytes),
    ...overrides,
  };
}

function encodeEnvelope(envelope: MmTokenEnvelope): string {
  return base64UrlEncode(utf8Encode(JSON.stringify(envelope)));
}

async function signMessage(
  signer: ReturnType<typeof createMmTokenKwilSigner>,
): Promise<Uint8Array> {
  return await (signer.signer as (message: Uint8Array) => Promise<Uint8Array>)(
    new Uint8Array([1, 2, 3]),
  );
}

describe("createMmTokenKwilSigner", () => {
  it("uses mm_token auth type and decoded signing_public_key bytes as identity", () => {
    const signer = createMmTokenKwilSigner(encodeEnvelope(createEnvelope()));

    expect(signer.signatureType).toBe("mm_token");
    expect(signer.identifier).toEqual(signingPublicKeyBytes);
  });

  it("returns the exact encoded envelope bytes from signMessage", async () => {
    const encoded = encodeEnvelope(createEnvelope());
    const signer = createMmTokenKwilSigner(encoded);

    expect(await signMessage(signer)).toEqual(utf8Encode(encoded));
  });

  it("accepts a decoded envelope object and returns its encoded form", async () => {
    const envelope = createEnvelope();
    const signer = createMmTokenKwilSigner(envelope);

    expect(await signMessage(signer)).toEqual(utf8Encode(encodeEnvelope(envelope)));
  });

  it("rejects raw JSON envelope strings (must be base64url-encoded)", () => {
    expect(() => createMmTokenKwilSigner(JSON.stringify(createEnvelope()))).toThrow(
      "Invalid mm_token envelope encoding",
    );
  });

  it("rejects invalid signature length", () => {
    expect(() =>
      createMmTokenKwilSigner(
        encodeEnvelope(createEnvelope({ signature: base64UrlEncode(new Uint8Array(63)) })),
      ),
    ).toThrow("Invalid mm_token signature length: expected 64, got 63");
  });

  it("rejects signing_public_key with the wrong byte length", () => {
    expect(() =>
      createMmTokenKwilSigner(
        encodeEnvelope(
          createEnvelope({
            payload: {
              version: 1,
              signing_public_key: base64UrlEncode(new Uint8Array(31)),
            },
          }),
        ),
      ),
    ).toThrow("Invalid mm_token signing_public_key length: expected 32, got 31");
  });

  it("keeps the token payload and exposes its storage_id", () => {
    const signer = createMmTokenKwilSigner(encodeEnvelope(createEnvelope()));

    expect(signer.mmTokenPayload.storage_id).toBe("storage-abc");
    expect(mmTokenStorageId(signer)).toBe("storage-abc");
  });

  it("builds the credential ukyc:// URI from a base64url-encoded token", () => {
    const credentialId = "0198c21d-79cb-7000-8000-000000000001";
    const encodedToken = encodeEnvelope(createEnvelope());
    const signer = createMmTokenKwilSigner(encodedToken);
    const credential = {
      id: credentialId,
      content_uri: mmTokenCredentialContentUri(signer, credentialId),
    };

    expect(credential).toEqual({
      id: credentialId,
      content_uri: `ukyc://storage-abc/blobs/${credentialId}`,
    });
  });

  it("fails when the token payload has no storage_id", () => {
    const signer = createMmTokenKwilSigner(
      encodeEnvelope(
        createEnvelope({
          payload: {
            version: 1,
            signing_public_key: base64UrlEncode(signingPublicKeyBytes),
          },
        }),
      ),
    );

    expect(() => mmTokenStorageId(signer)).toThrow("mm_token payload is missing storage_id");
  });
});
