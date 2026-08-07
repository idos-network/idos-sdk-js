import { base64UrlEncode, utf8Encode } from "@idos-network/utils/codecs";
import { describe, expect, it } from "vitest";

import { createMmTokenKwilSigner, type MmTokenEnvelope } from "./create-mm-token-kwil-signer.js";

const signingPublicKeyBytes = new Uint8Array(Array.from({ length: 32 }, (_, index) => index + 1));
const signatureBytes = new Uint8Array(Array.from({ length: 64 }, (_, index) => index + 64));

function createToken(signingPublicKey = signingPublicKeyBytes): string {
  return base64UrlEncode(
    utf8Encode(
      JSON.stringify({
        version: 1,
        aud: ["idos:kwil"],
        signing_public_key: base64UrlEncode(signingPublicKey),
      }),
    ),
  );
}

function createEnvelope(overrides: Partial<MmTokenEnvelope> = {}): MmTokenEnvelope {
  return {
    token: createToken(),
    signature: base64UrlEncode(signatureBytes),
    ...overrides,
  };
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
    const signer = createMmTokenKwilSigner(createEnvelope());

    expect(signer.signatureType).toBe("mm_token");
    expect(signer.identifier).toEqual(signingPublicKeyBytes);
  });

  it("returns the exact envelope bytes from signMessage", async () => {
    const envelope = createEnvelope();
    const envelopeJson = `{"signature":"${envelope.signature}","token":"${envelope.token}"}`;
    const signer = createMmTokenKwilSigner(envelopeJson);

    expect(await signMessage(signer)).toEqual(utf8Encode(envelopeJson));
  });

  it("rejects invalid token base64url", () => {
    expect(() => createMmTokenKwilSigner(createEnvelope({ token: "*" }))).toThrow(
      "Invalid mm_token envelope token encoding",
    );
  });

  it("rejects invalid signature length", () => {
    expect(() =>
      createMmTokenKwilSigner(createEnvelope({ signature: base64UrlEncode(new Uint8Array(63)) })),
    ).toThrow("Invalid mm_token signature length: expected 64, got 63");
  });

  it("rejects signing_public_key with the wrong byte length", () => {
    const token = createToken(new Uint8Array(31));

    expect(() => createMmTokenKwilSigner(createEnvelope({ token }))).toThrow(
      "Invalid mm_token signing_public_key length: expected 32, got 31",
    );
  });
});
