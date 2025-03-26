import { NodeKwil } from "@kwilteam/kwil-js";

import nacl from "tweetnacl";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createIssuerServerConfig } from "./create-issuer-server-config";

// Mock the @kwilteam/kwil-js module
vi.mock("@kwilteam/kwil-js", () => {
  return {
    NodeKwil: vi.fn().mockImplementation(() => ({
      chainInfo: vi.fn().mockResolvedValue({ data: { chain_id: "mock-chain-id" } }),
    })),
    WebKwil: vi.fn(),
    KwilSigner: vi.fn(),
    Utils: {
      ActionInput: {
        fromObject: vi.fn(),
      },
    },
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
      signingKeyPair,
      encryptionSecretKey,
      timeout: 30_000,
    };

    const result = await createIssuerServerConfig(params);

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

    // Check the returned config
    expect(result).toEqual({
      kwilClient: expect.any(Object),
      signingKeyPair: expect.any(Object),
      encryptionSecretKey: expect.any(Uint8Array),
    });
  });
});
