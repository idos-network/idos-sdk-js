import nacl from "tweetnacl";
import { describe, expect, it, vi } from "vitest";

import { idOSIssuer } from "./index";

const mocks = vi.hoisted(() => ({
  blobGateway: { fetchBlob: vi.fn() },
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

describe("idOSIssuer", () => {
  it("creates one KGW authenticated blob gateway for issuer services", async () => {
    const { createKgwAuthenticatedBlobGateway } = await import("@idos-network/kwil-infra");
    const signingKeyPair = nacl.sign.keyPair();

    await idOSIssuer.init({
      nodeUrl: "https://nodes.example",
      blobGatewayUrl: "https://blob.example",
      signingKeyPair,
      encryptionSecretKey: nacl.box.keyPair().secretKey,
    });

    expect(createKgwAuthenticatedBlobGateway).toHaveBeenCalledWith({
      url: "https://blob.example",
      kwilClient: mocks.kwilClient,
      signer: mocks.signer,
    });
  });
});
