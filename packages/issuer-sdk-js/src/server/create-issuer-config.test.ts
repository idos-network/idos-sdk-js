import { NodeKwil } from "@kwilteam/kwil-js";

import nacl from "tweetnacl";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createIssuerConfig } from "./create-issuer-config";

// Mock the @kwilteam/kwil-js module
vi.mock("@kwilteam/kwil-js", () => {
  return {
    NodeKwil: vi.fn(),
    KwilSigner: vi.fn(),
    Utils: {
      ActionInput: {
        fromObject: vi.fn(),
      },
    },
  };
});

describe("createIssuerConfig", () => {
  let mockChainInfo: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();

    // Set up mock implementations
    mockChainInfo = vi.fn().mockResolvedValue({ data: { chain_id: "mock-chain-id" } });

    (NodeKwil as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => ({
      chainInfo: mockChainInfo,
    }));
  });

  it("should correctly initialize and return config", async () => {
    const signingKeyPair = nacl.sign.keyPair();
    const encryptionSecretKey = signingKeyPair.secretKey;
    const params = {
      nodeUrl: "http://mock-node-url",
      signingKeyPair,
      encryptionSecretKey,
      timeout: 30_000,
    };

    const result = await createIssuerConfig(params);

    // Check if NodeKwil was called correctly
    expect(NodeKwil).toHaveBeenCalledWith({
      kwilProvider: params.nodeUrl,
      chainId: "",
    });
    expect(NodeKwil).toHaveBeenCalledWith({
      kwilProvider: params.nodeUrl,
      chainId: "mock-chain-id",
      timeout: 30_000,
    });

    // Check if methods were called
    expect(mockChainInfo).toHaveBeenCalled();

    // Check the returned config
    expect(result).toEqual({
      kwilClient: expect.any(Object),
      signingKeyPair: expect.any(Object),
      encryptionSecretKey: expect.any(Uint8Array),
    });
  });
});
