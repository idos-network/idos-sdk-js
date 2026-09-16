import nacl from "tweetnacl";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { idOSIssuer, toDelegatedWriteGrantBaseParams } from "./index.js";

const mocks = vi.hoisted(() => ({
  blobGateway: { fetchBlob: vi.fn(), uploadCredentialBlobs: vi.fn() },
  createPreliminaryCredentialsByDwg: vi.fn(),
  dwgMessage: vi.fn(async () => ({ message: "dwg-message-string" })),
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
  dwgMessage: mocks.dwgMessage,
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

  it("uses and enforces distinct custom content URIs for delegated write grants", async () => {
    const issuer = await idOSIssuer.init({
      nodeUrl: "https://nodes.example",
      blobGatewayUrl: "https://blob.example",
      signingKeyPair: nacl.sign.keyPair(),
    });
    const originalContentUri = "ukyc://storage-abc/blobs/original";
    const copyContentUri = "ukyc://storage-abc/blobs/copy";
    const credentialParams = {
      publicNotes: "{}",
      plaintextContent: new Uint8Array([1, 2, 3]),
      recipientEncryptionPublicKey: nacl.box.keyPair().publicKey,
      originalContentUri,
      copyContentUri,
    };
    const delegatedWriteGrant = {
      id: crypto.randomUUID(),
      ownerWalletIdentifier: "owner",
      consumerWalletIdentifier: "consumer",
      issuerPublicKey: "issuer",
      accessGrantTimelock: "2026-01-01T00:00:00Z",
      notUsableBefore: "2026-01-01T00:00:00Z",
      notUsableAfter: "2026-01-02T00:00:00Z",
      signature: "signature",
    };
    const consumerEncryptionPublicKey = nacl.box.keyPair().publicKey;

    const result = await issuer.createCredentialByDelegatedWriteGrant(
      credentialParams,
      delegatedWriteGrant,
      consumerEncryptionPublicKey,
    );

    const payload = mocks.createPreliminaryCredentialsByDwg.mock.calls[0]?.[1];
    expect(payload.original_content_uri).toBe(originalContentUri);
    expect(payload.copy_content_uri).toBe(copyContentUri);
    expect(result.originalCredential.content_uri).toBe(originalContentUri);
    expect(result.copyCredential.content_uri).toBe(copyContentUri);

    await expect(
      issuer.createCredentialByDelegatedWriteGrant(
        { ...credentialParams, copyContentUri: originalContentUri },
        delegatedWriteGrant,
        consumerEncryptionPublicKey,
      ),
    ).rejects.toThrow("Original and copy credentials must use distinct content URIs");
    expect(mocks.createPreliminaryCredentialsByDwg).toHaveBeenCalledOnce();
  });

  it("maps request params for createCredentialByDelegatedWriteGrant via toDelegatedWriteGrantBaseParams", async () => {
    const issuer = await idOSIssuer.init({
      nodeUrl: "https://nodes.example",
      blobGatewayUrl: "https://blob.example",
      signingKeyPair: nacl.sign.keyPair(),
    });

    const dwgInput = {
      id: crypto.randomUUID(),
      owner_wallet_identifier: "0x311CEe6648df431EbbeA38dfB680C28661c893Ea",
      grantee_wallet_identifier: "0x1111111111111111111111111111111111111111",
      issuer_public_key: "issuer-key",
      access_grant_timelock: "2026-01-01T00:00:00Z",
      not_usable_before: "2026-01-01T00:00:00Z",
      not_usable_after: "2026-01-02T00:00:00Z",
    };

    const message = await issuer.requestDelegatedWriteGrantMessage(dwgInput);
    const params = toDelegatedWriteGrantBaseParams(dwgInput);

    expect(message).toBe("dwg-message-string");
    expect(params).toEqual({
      id: dwgInput.id,
      ownerWalletIdentifier: dwgInput.owner_wallet_identifier,
      consumerWalletIdentifier: dwgInput.grantee_wallet_identifier,
      issuerPublicKey: dwgInput.issuer_public_key,
      accessGrantTimelock: dwgInput.access_grant_timelock,
      notUsableBefore: dwgInput.not_usable_before,
      notUsableAfter: dwgInput.not_usable_after,
    });

    const userEncryptionKeyPair = nacl.box.keyPair();
    const copyEncryptionKeyPair = nacl.box.keyPair();

    await issuer.createCredentialByDelegatedWriteGrant(
      {
        publicNotes: "{}",
        plaintextContent: new Uint8Array([1, 2, 3]),
        recipientEncryptionPublicKey: userEncryptionKeyPair.publicKey,
      },
      {
        ...params,
        signature: "0xsignature",
      },
      copyEncryptionKeyPair.publicKey,
    );

    expect(mocks.createPreliminaryCredentialsByDwg).toHaveBeenCalled();
    const payload = mocks.createPreliminaryCredentialsByDwg.mock.calls.at(-1)?.[1];
    expect(payload.dwg_id).toBe(params.id);
    expect(payload.dwg_owner).toBe(params.ownerWalletIdentifier);
    expect(payload.dwg_grantee).toBe(params.consumerWalletIdentifier);
    expect(payload.dwg_issuer_public_key).toBe(params.issuerPublicKey);
    expect(payload.dwg_access_grant_timelock).toBe(params.accessGrantTimelock);
    expect(payload.dwg_not_before).toBe(params.notUsableBefore);
    expect(payload.dwg_not_after).toBe(params.notUsableAfter);
    expect(payload.dwg_signature).toBe("0xsignature");
  });
});
