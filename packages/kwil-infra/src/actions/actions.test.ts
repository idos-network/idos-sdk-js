import { describe, expect, it } from "vitest";

import { CreatePreliminaryCredentialsByDwgInputSchema } from "./actions";

const validPreliminaryCredentialsByDwgInput = {
  request_id: "00000000-0000-4000-8000-000000000001",
  issuer_auth_public_key: "issuer-auth-public-key",
  original_encryptor_public_key: "original-encryptor-public-key",
  original_id: "00000000-0000-4000-8000-000000000002",
  original_content_uri: "ipfs://bafkreiepinbumzepnoln7co5vea4kf3lcctnqolb3u6bvsellgznymt2uq",
  original_content_size: 123,
  original_public_notes: "{}",
  original_public_notes_signature: "original-public-notes-signature",
  original_broader_signature: "original-broader-signature",
  copy_encryptor_public_key: "copy-encryptor-public-key",
  copy_id: "00000000-0000-4000-8000-000000000003",
  copy_content_uri: "ipfs://bafkreihdwdcefgh4dqkjv67uzcmw7ojee6xedzdetojuzjevtenxquvyku",
  copy_content_size: 456,
  copy_public_notes_signature: "copy-public-notes-signature",
  copy_broader_signature: "copy-broader-signature",
  content_hash: "content-hash",
  dwg_owner: "dwg-owner",
  dwg_grantee: "dwg-grantee",
  dwg_issuer_public_key: "dwg-issuer-public-key",
  dwg_id: "00000000-0000-4000-8000-000000000004",
  dwg_access_grant_timelock: "0",
  dwg_not_before: "2026-01-01T00:00:00Z",
  dwg_not_after: "2026-12-31T23:59:59Z",
  dwg_signature: "dwg-signature",
};

describe("CreatePreliminaryCredentialsByDwgInputSchema", () => {
  it("accepts IPFS content URIs and non-negative integer sizes", () => {
    expect(() =>
      CreatePreliminaryCredentialsByDwgInputSchema.parse(validPreliminaryCredentialsByDwgInput),
    ).not.toThrow();
  });

  it("rejects non-IPFS content URIs", () => {
    expect(() =>
      CreatePreliminaryCredentialsByDwgInputSchema.parse({
        ...validPreliminaryCredentialsByDwgInput,
        original_content_uri: "https://example.com/blob",
      }),
    ).toThrow();
    expect(() =>
      CreatePreliminaryCredentialsByDwgInputSchema.parse({
        ...validPreliminaryCredentialsByDwgInput,
        copy_content_uri: "bafkreihdwdcefgh4dqkjv67uzcmw7ojee6xedzdetojuzjevtenxquvyku",
      }),
    ).toThrow();
  });

  it("rejects negative and non-integer content sizes", () => {
    expect(() =>
      CreatePreliminaryCredentialsByDwgInputSchema.parse({
        ...validPreliminaryCredentialsByDwgInput,
        original_content_size: -1,
      }),
    ).toThrow();
    expect(() =>
      CreatePreliminaryCredentialsByDwgInputSchema.parse({
        ...validPreliminaryCredentialsByDwgInput,
        copy_content_size: 1.5,
      }),
    ).toThrow();
  });
});
