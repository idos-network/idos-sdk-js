import nacl from "tweetnacl";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createIssuerServerConfig } from "./create-issuer-server-config";

// Mock the @idos-network/core module
vi.mock("@idos-network/core", () => {
  const mockKwilClient = {
    setSigner: vi.fn(),
  };

  return {
    createNodeKwilClient: vi.fn().mockResolvedValue(mockKwilClient),
    createServerKwilSigner: vi.fn().mockReturnValue([{ mockSigner: true }]),
  };
});

describe("createIssuerConfig", () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  it("should correctly initialize and return config", async () => {
    const signingKeyPair = nacl.sign.keyPair();
    const encryptionSecretKey = signingKeyPair.secretKey;
    const params = {
      nodeUrl: "http://mock-node-url",
      chainId: "mock-chain-id",
      signingKeyPair,
      encryptionSecretKey,
      timeout: 30_000,
    };

    // Import mocked functions
    const { createNodeKwilClient, createServerKwilSigner } = await import("@idos-network/core");

    const result = await createIssuerServerConfig(params);

    // Check if createNodeKwilClient was called correctly
    expect(createNodeKwilClient).toHaveBeenCalledWith({
      nodeUrl: params.nodeUrl,
      chainId: params.chainId,
    });

    // Check if createServerKwilSigner was called correctly
    expect(createServerKwilSigner).toHaveBeenCalledWith(params.signingKeyPair);

    // Check the returned config
    expect(result).toEqual({
      kwilClient: expect.any(Object),
      signingKeyPair: params.signingKeyPair,
      encryptionSecretKey: params.encryptionSecretKey,
    });
  });
});
