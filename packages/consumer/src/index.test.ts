import { base64Encode } from "@idos-network/utils/codecs";
import { utf8Encode } from "@idos-network/utils/codecs";
import { encryptContent } from "@idos-network/utils/cryptography";
import nacl from "tweetnacl";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { idOSConsumer } from "./index.js";

const mocks = vi.hoisted(() => ({
  blobGateway: { fetchBlob: vi.fn(), deleteCredentialBlob: vi.fn(), hasAccessToken: false },
  getCredentialShared: vi.fn(),
  rescindSharedCredential: vi.fn(),
  kwilClient: {
    setSigner: vi.fn(),
  },
  signer: { publicKey: "signer" },
}));

vi.mock("@idos-network/kwil-infra", () => ({
  createKgwAuthenticatedBlobGateway: vi.fn(() => mocks.blobGateway),
  createNodeKwilClient: vi.fn(async () => mocks.kwilClient),
  createServerKwilSigner: vi.fn(async () => [mocks.signer, "consumer-address"]),
}));

vi.mock("@idos-network/kwil-infra/actions", () => ({
  getAccessGrantsForCredential: vi.fn(),
  getAccessGrantsGrantedCount: vi.fn(),
  getCredentialShared: mocks.getCredentialShared,
  getCredentialsSharedByUser: vi.fn(),
  getGrants: vi.fn(),
  rescindSharedCredential: mocks.rescindSharedCredential,
}));

describe("idOSConsumer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.blobGateway.hasAccessToken = false;
  });

  it("creates a KGW authenticated blob gateway for blob-backed reads", async () => {
    const { createKgwAuthenticatedBlobGateway } = await import("@idos-network/kwil-infra");

    await idOSConsumer.init({
      nodeUrl: "https://nodes.example",
      blobGatewayUrl: "https://blob.example",
      consumerSigner: nacl.sign.keyPair(),
      recipientEncryptionPrivateKey: base64Encode(nacl.box.keyPair().secretKey),
    });

    expect(createKgwAuthenticatedBlobGateway).toHaveBeenCalledWith({
      url: "https://blob.example",
      kwilClient: mocks.kwilClient,
      signer: mocks.signer,
    });
  });

  it("falls back to nodeUrl when blobGatewayUrl is omitted", async () => {
    const { createKgwAuthenticatedBlobGateway } = await import("@idos-network/kwil-infra");

    await idOSConsumer.init({
      nodeUrl: "https://nodes.example",
      consumerSigner: nacl.sign.keyPair(),
      recipientEncryptionPrivateKey: base64Encode(nacl.box.keyPair().secretKey),
    });

    expect(createKgwAuthenticatedBlobGateway).toHaveBeenCalledWith({
      url: "https://nodes.example",
      kwilClient: mocks.kwilClient,
      signer: mocks.signer,
    });
  });

  it("normalizes string content_size before comparing blob byte length", async () => {
    const recipientKeyPair = nacl.box.keyPair();
    const encryptorKeyPair = nacl.box.keyPair();
    const encryptedContent = encryptContent(
      utf8Encode("hello from blob"),
      recipientKeyPair.publicKey,
      encryptorKeyPair.secretKey,
    );
    mocks.blobGateway.fetchBlob.mockResolvedValueOnce(encryptedContent);
    mocks.getCredentialShared.mockResolvedValueOnce([
      {
        id: "6796e664-3c0c-4e3f-b900-afe2dc49c08e",
        user_id: "00000000-0000-0000-0000-000000000000",
        public_notes: "",
        content: null,
        content_uri: "ipfs://bafkreiayiizdgzqnwn43lqmfurzsg5epvknle5egvpfrwplwj6jtnifsjm",
        content_size: String(encryptedContent.byteLength),
        encryptor_public_key: base64Encode(encryptorKeyPair.publicKey),
        issuer_auth_public_key: "issuer",
        inserter_type: null,
        inserter_id: null,
      },
    ]);

    const consumer = await idOSConsumer.init({
      nodeUrl: "https://nodes.example",
      blobGatewayUrl: "https://blob.example",
      consumerSigner: nacl.sign.keyPair(),
      recipientEncryptionPrivateKey: base64Encode(recipientKeyPair.secretKey),
    });

    await expect(
      consumer.getCredentialSharedContentDecrypted("6796e664-3c0c-4e3f-b900-afe2dc49c08e"),
    ).resolves.toBe("hello from blob");
    expect(mocks.blobGateway.fetchBlob).toHaveBeenCalledWith({
      credentialId: "6796e664-3c0c-4e3f-b900-afe2dc49c08e",
      contentUri: "ipfs://bafkreiayiizdgzqnwn43lqmfurzsg5epvknle5egvpfrwplwj6jtnifsjm",
      expectedSize: encryptedContent.byteLength,
    });
  });

  it("reads legacy inline-content credentials without fetching blobs", async () => {
    const recipientKeyPair = nacl.box.keyPair();
    const encryptorKeyPair = nacl.box.keyPair();
    const encryptedContent = encryptContent(
      utf8Encode("hello from inline"),
      recipientKeyPair.publicKey,
      encryptorKeyPair.secretKey,
    );
    mocks.getCredentialShared.mockResolvedValueOnce([
      {
        id: "6796e664-3c0c-4e3f-b900-afe2dc49c08e",
        user_id: "00000000-0000-0000-0000-000000000000",
        public_notes: "",
        content: base64Encode(encryptedContent),
        content_uri: null,
        content_size: null,
        encryptor_public_key: base64Encode(encryptorKeyPair.publicKey),
        issuer_auth_public_key: "issuer",
        inserter_type: null,
        inserter_id: null,
      },
    ]);

    const consumer = await idOSConsumer.init({
      nodeUrl: "https://nodes.example",
      blobGatewayUrl: "https://blob.example",
      consumerSigner: nacl.sign.keyPair(),
      recipientEncryptionPrivateKey: base64Encode(recipientKeyPair.secretKey),
    });

    await expect(
      consumer.getCredentialSharedContentDecrypted("6796e664-3c0c-4e3f-b900-afe2dc49c08e"),
    ).resolves.toBe("hello from inline");
    expect(mocks.blobGateway.fetchBlob).not.toHaveBeenCalled();
  });

  it("passes the MM storage authority through to the blob gateway", async () => {
    const { createKgwAuthenticatedBlobGateway } = await import("@idos-network/kwil-infra");
    const mmAuth = { accessToken: "mm-envelope" } as never;

    await idOSConsumer.init({
      nodeUrl: "https://nodes.example",
      blobGatewayUrl: "https://blob.example",
      mmAuth,
      consumerSigner: nacl.sign.keyPair(),
      recipientEncryptionPrivateKey: base64Encode(nacl.box.keyPair().secretKey),
    });

    expect(createKgwAuthenticatedBlobGateway).toHaveBeenCalledWith({
      url: "https://blob.example",
      kwilClient: mocks.kwilClient,
      signer: mocks.signer,
      mmAuth,
    });
  });

  it("rescinds a legacy inline credential without calling blob-gateway delete", async () => {
    mocks.getCredentialShared.mockResolvedValueOnce([
      {
        id: "6796e664-3c0c-4e3f-b900-afe2dc49c08e",
        content_uri: null,
      },
    ]);

    const consumer = await idOSConsumer.init({
      nodeUrl: "https://nodes.example",
      blobGatewayUrl: "https://blob.example",
      consumerSigner: nacl.sign.keyPair(),
      recipientEncryptionPrivateKey: base64Encode(nacl.box.keyPair().secretKey),
    });

    await consumer.rescindSharedCredential("6796e664-3c0c-4e3f-b900-afe2dc49c08e");

    expect(mocks.rescindSharedCredential).toHaveBeenCalledWith(mocks.kwilClient, {
      credential_id: "6796e664-3c0c-4e3f-b900-afe2dc49c08e",
    });
    expect(mocks.blobGateway.deleteCredentialBlob).not.toHaveBeenCalled();
  });

  it("rescinds a blob-backed credential then deletes the blob", async () => {
    mocks.getCredentialShared.mockResolvedValueOnce([
      {
        id: "6796e664-3c0c-4e3f-b900-afe2dc49c08e",
        content_uri: "ipfs://bafkreiayiizdgzqnwn43lqmfurzsg5epvknle5egvpfrwplwj6jtnifsjm",
      },
    ]);

    const consumer = await idOSConsumer.init({
      nodeUrl: "https://nodes.example",
      blobGatewayUrl: "https://blob.example",
      consumerSigner: nacl.sign.keyPair(),
      recipientEncryptionPrivateKey: base64Encode(nacl.box.keyPair().secretKey),
    });

    await consumer.rescindSharedCredential("6796e664-3c0c-4e3f-b900-afe2dc49c08e");

    expect(mocks.rescindSharedCredential).toHaveBeenCalledOnce();
    expect(mocks.blobGateway.deleteCredentialBlob).toHaveBeenCalledWith({
      credentialId: "6796e664-3c0c-4e3f-b900-afe2dc49c08e",
    });
  });

  it("fails before Kwil when rescinding a ukyc:// credential without an accessToken", async () => {
    mocks.getCredentialShared.mockResolvedValueOnce([
      {
        id: "6796e664-3c0c-4e3f-b900-afe2dc49c08e",
        content_uri: "ukyc://object-1",
      },
    ]);

    const consumer = await idOSConsumer.init({
      nodeUrl: "https://nodes.example",
      blobGatewayUrl: "https://blob.example",
      consumerSigner: nacl.sign.keyPair(),
      recipientEncryptionPrivateKey: base64Encode(nacl.box.keyPair().secretKey),
    });

    await expect(
      consumer.rescindSharedCredential("6796e664-3c0c-4e3f-b900-afe2dc49c08e"),
    ).rejects.toThrow(/requires an accessToken/);
    expect(mocks.rescindSharedCredential).not.toHaveBeenCalled();
    expect(mocks.blobGateway.deleteCredentialBlob).not.toHaveBeenCalled();
  });
});
