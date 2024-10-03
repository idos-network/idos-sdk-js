import { KwilSigner, NodeKwil, Utils } from "@kwilteam/kwil-js";
import type { Wallet } from "ethers";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createHumanProfile, createIssuerConfig } from "./index";

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
  let mockListDatabases: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();

    // Set up mock implementations
    mockChainInfo = vi.fn().mockResolvedValue({ data: { chain_id: "mock-chain-id" } });
    mockListDatabases = vi.fn().mockResolvedValue({
      data: [{ name: "idos", dbid: "mock-dbid" }],
    });

    (NodeKwil as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => ({
      chainInfo: mockChainInfo,
      listDatabases: mockListDatabases,
    }));
  });

  it("should correctly initialize and return config", async () => {
    const mockWallet = { address: "mock-address" } as Wallet;
    const params = {
      nodeUrl: "http://mock-node-url",
      privateKey: "mock-private-key",
      signer: mockWallet,
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
    });

    // Check if methods were called
    expect(mockChainInfo).toHaveBeenCalled();
    expect(mockListDatabases).toHaveBeenCalled();

    // Check if KwilSigner was initialized correctly
    expect(KwilSigner).toHaveBeenCalledWith(mockWallet, "mock-address");

    // Check the returned config
    expect(result).toEqual({
      chainId: "mock-chain-id",
      dbid: "mock-dbid",
      kwilClient: expect.any(Object),
      signer: expect.any(Object),
    });
  });
});
