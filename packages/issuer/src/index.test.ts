import nacl from "tweetnacl";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { idOSIssuer } from "./index.js";

const mocks = vi.hoisted(() => ({
  blobGateway: { fetchBlob: vi.fn(), uploadCredentialBlobs: vi.fn() },
  createPreliminaryCredentialsByDwg: vi.fn(),
  kwilClient: {
    setSigner: vi.fn(),
  },
  signer: { publicKey: "signer" },
}));

vi.mock("@idos-network/kwil-infra", () => ({
  createKgwAuthenticatedBlobGateway: vi.fn(() => mocks.blobGateway),
  createNodeKwilClient: vi.fn(async () => mocks.kwilClient),
  createServerKwilSigner: vi.fn(async () => [mocks.signer]),
}));

vi.mock("@idos-network/kwil-infra/actions", async (importOriginal) => ({
  ...((await importOriginal()) as object),
  createPreliminaryCredentialsByDwg: mocks.createPreliminaryCredentialsByDwg,
}));

describe("idOSIssuer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates one KGW authenticated blob gateway for issuer services", async () => {
    const { createKgwAuthenticatedBlobGateway } = await import("@idos-network/kwil-infra");
    const signingKeyPair = nacl.sign.keyPair();

    await idOSIssuer.init({
      nodeUrl: "https://nodes.example",
      blobGatewayUrl: "https://blob.example",
      signingKeyPair,
    });

    expect(createKgwAuthenticatedBlobGateway).toHaveBeenCalledWith({
      url: "https://blob.example",
      kwilClient: mocks.kwilClient,
      signer: mocks.signer,
    });
  });

  it("creates delegated write grant credentials through the blob-backed flow", async () => {
    const { createPreliminaryCredentialsByDwg } = await import("@idos-network/kwil-infra/actions");
    const issuer = await idOSIssuer.init({
      nodeUrl: "https://nodes.example",
      blobGatewayUrl: "https://blob.example",
      signingKeyPair: nacl.sign.keyPair(),
    });
    const userEncryptionKeyPair = nacl.box.keyPair();
    const copyEncryptionKeyPair = nacl.box.keyPair();

    const result = await issuer.createCredentialByDelegatedWriteGrant(
      {
        publicNotes: "{}",
        plaintextContent: new Uint8Array([1, 2, 3]),
        recipientEncryptionPublicKey: userEncryptionKeyPair.publicKey,
      },
      {
        id: crypto.randomUUID(),
        ownerWalletIdentifier: "owner",
        consumerWalletIdentifier: "consumer",
        issuerPublicKey: "issuer",
        accessGrantTimelock: "2026-01-01T00:00:00Z",
        notUsableBefore: "2026-01-01T00:00:00Z",
        notUsableAfter: "2026-01-02T00:00:00Z",
        signature: "signature",
      },
      copyEncryptionKeyPair.publicKey,
    );

    expect(createPreliminaryCredentialsByDwg).toHaveBeenCalledOnce();
    expect(mocks.blobGateway.uploadCredentialBlobs).toHaveBeenCalledOnce();

    const payload = mocks.createPreliminaryCredentialsByDwg.mock.calls[0]?.[1];
    expect(payload.original_content_uri).toMatch(/^ipfs:\/\//);
    expect(payload.copy_content_uri).toMatch(/^ipfs:\/\//);
    expect(payload.original_content_size).toBeGreaterThan(0);
    expect(payload.copy_content_size).toBeGreaterThan(0);
    expect(mocks.blobGateway.uploadCredentialBlobs).toHaveBeenCalledWith({
      requestId: payload.request_id,
      original: expect.any(Uint8Array),
      copy: expect.any(Uint8Array),
    });
    expect(result.originalCredential).toMatchObject({
      id: payload.original_id,
      content_uri: payload.original_content_uri,
      content_size: payload.original_content_size,
    });
    expect(result.copyCredential).toMatchObject({
      id: payload.copy_id,
      content_uri: payload.copy_content_uri,
      content_size: payload.copy_content_size,
    });
    expect(mocks.createPreliminaryCredentialsByDwg.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.blobGateway.uploadCredentialBlobs.mock.invocationCallOrder[0],
    );
  });
});
