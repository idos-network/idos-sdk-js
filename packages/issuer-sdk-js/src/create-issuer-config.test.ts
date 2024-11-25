import { KwilSigner, NodeKwil } from "@kwilteam/kwil-js";
import * as Base64Codec from "@stablelib/base64";
import { Wallet } from "ethers";
import nacl from "tweetnacl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createIssuerConfig } from "./index";

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
    const mockWallet = new Wallet(
      "dcdda6663be8dfa23d0e54a31ff6fddba2fdf8a1f0eae985c59857031e6da169",
    );
    const mockEncryptionSecretKey = nacl.box.keyPair();
    const mockSigingSecretKey = nacl.sign.keyPair();

    const params = {
      signingKeyPair: mockSigingSecretKey,
      encryptionKeyPair: mockEncryptionSecretKey,
      nodeUrl: "http://mock-node-url",
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
    console.log({ mockWallet });

    // Check if KwilSigner was initialized correctly
    expect(KwilSigner).toHaveBeenCalledWith(
      // found in create-issuer-config.ts line 24
      expect.any(Function),
      expect.any(Uint8Array),
      "ed25519",
    );
    // Check the returned config
    expect(result).toEqual({
      chainId: "mock-chain-id",
      dbid: "mock-dbid",
      kwilClient: expect.any(Object),
      kwilSigner: expect.any(Object),
      encryptionKeyPair: params.encryptionKeyPair,
      signingKeyPair: params.signingKeyPair,
    });
  });
});
