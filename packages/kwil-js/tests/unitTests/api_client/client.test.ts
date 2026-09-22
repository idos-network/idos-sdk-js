import { stringToBytes } from "../../../dist/utils/serial";
import Client from "../../../src/api_client/client";
import { ClientConfig } from "../../../src/api_client/config";
import { BytesEncodingStatus } from "../../../src/core/enums";
import { SelectQueryRequest } from "../../../src/core/jsonrpc";
import { CallClientResponse, Message, Msg } from "../../../src/core/message";
import { Account, ChainInfo, DatasetInfo } from "../../../src/core/network";
import { GenericResponse } from "../../../src/core/resreq";
import { SignatureType } from "../../../src/core/signature";
import { Transaction, Txn } from "../../../src/core/tx";
import { TxInfoReceipt } from "../../../src/core/txQuery";
import { bytesToBase64 } from "../../../src/utils/base64";
import { hexToBytes } from "../../../src/utils/serial";
import { postMock } from "./api-utils";

require("dotenv").config();

// Test class that exposes protected methods
class TestClient extends Client {
  constructor(opts: ClientConfig) {
    super(opts);
  }

  public async getSchema(dbid: string): Promise<GenericResponse<any>> {
    // We'll simulate it using a direct API call as it is expected by the test
    return await this.get(`/api/v1/databases/${dbid}/schema`);
  }

  public async getAccount(accountId: Uint8Array): Promise<GenericResponse<Account>> {
    return await this.getAccountClient({
      identifier: bytesToBase64(accountId),
      key_type: "secp256k1",
    });
  }

  public async listDatabases(owner: Uint8Array): Promise<GenericResponse<DatasetInfo[]>> {
    return await this.listDatabasesClient(owner);
  }

  public async estimateCost(tx: Transaction): Promise<GenericResponse<string>> {
    return await this.estimateCostClient(tx);
  }

  public async broadcast(tx: Transaction): Promise<GenericResponse<{ tx_hash: string }>> {
    const result = await this.broadcastClient(tx);
    return {
      status: result.status,
      data: result.data ? { tx_hash: result.data.tx_hash } : undefined,
    };
  }

  public async ping(): Promise<GenericResponse<string>> {
    return await this.pingClient();
  }

  public async chainInfo(): Promise<GenericResponse<ChainInfo>> {
    return await this.chainInfoClient();
  }

  public async selectQuery(
    query: SelectQueryRequest,
  ): Promise<GenericResponse<Record<string, any>[]>> {
    return await this.selectQueryClient(query);
  }

  public async txInfo(tx_hash: string): Promise<GenericResponse<TxInfoReceipt>> {
    return await this.txInfoClient(tx_hash);
  }

  public async call(msg: Message): Promise<CallClientResponse<any>> {
    return await this.callClient(msg);
  }
}

describe("Client", () => {
  let client: TestClient;
  const mockConfig = {
    kwilProvider: "https://shouldntmatter.com",
    timeout: 10000,
    apiKey: "",
    logging: false,
    logger: jest.fn(),
    network: "",
  };

  beforeEach(() => {
    client = new TestClient(mockConfig);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getAccount", () => {
    it("should get account if account exists", async () => {
      postMock.mockResolvedValue({
        status: 200,
        data: {
          jsonrpc: "2.0",
          id: 1,
          result: {
            id: {
              identifier: "bW9ja093bmVy",
              key_type: "secp256k1",
            },
            nonce: 1,
            balance: "mockBalance",
          },
        },
      });
      const result = await client.getAccount(stringToBytes("someAddress"));
      expect(result.status).toBe(200);
      expect(result.data?.id?.identifier).toBeDefined();
      expect(postMock).toHaveBeenCalledWith(
        "/rpc/v1",
        expect.objectContaining({
          jsonrpc: "2.0",
          method: "user.account",
        }),
        undefined,
      );
    });

    it("should throw error if account does not exist", async () => {
      const mockRes = {
        status: 200,
        data: {
          jsonrpc: "2.0",
          id: 1,
          error: {
            code: -32602,
            message: "Account not found",
          },
        },
      };

      postMock.mockResolvedValue(mockRes);

      await expect(client.getAccount(stringToBytes("someAddress"))).rejects.toThrow(
        "JSON RPC call error: code: -32602, message: Account not found",
      );
      expect(postMock).toHaveBeenCalledWith(
        "/rpc/v1",
        expect.objectContaining({
          jsonrpc: "2.0",
          method: "user.account",
        }),
        undefined,
      );
    });
  });

  describe("broadcast", () => {
    it("should throw an error when broadcasting an unsigned transaction", async () => {
      const tx = Txn.create<BytesEncodingStatus.BASE64_ENCODED>(() => {}); // Assuming this transaction is unsigned by default
      await expect(client.broadcast(tx)).rejects.toThrow("Tx must be signed before broadcasting.");
    });

    it("passes through 64-char hex tx_hash from broadcast", async () => {
      const hexHash = "e3d2bc9e38cc02af7e6babe4094a8a8afcf0074cb93151ca8339770ae554f45d";
      postMock.mockResolvedValue({
        status: 200,
        data: {
          jsonrpc: "2.0",
          id: 1,
          result: { tx_hash: hexHash },
        },
      });

      const tx = Txn.create<BytesEncodingStatus.BASE64_ENCODED>((data) => {
        data.signature = { sig: "c2ln", type: SignatureType.SECP256K1_PERSONAL };
      });
      const result = await client.broadcast(tx);
      expect(result.data?.tx_hash).toBe(hexHash);
    });

    it("rejects a corrupted 96-char hex tx_hash", async () => {
      postMock.mockResolvedValue({
        status: 200,
        data: {
          jsonrpc: "2.0",
          id: 1,
          result: {
            tx_hash:
              "7b77766dcf5edfc71cd3669fedee9b69b7b8d3de1af1af1a7dc7f4d3be1c6fddf5e7571af37dfdefbd1a7b9e787f8e5d",
          },
        },
      });

      const tx = Txn.create<BytesEncodingStatus.BASE64_ENCODED>((data) => {
        data.signature = { sig: "c2ln", type: SignatureType.SECP256K1_PERSONAL };
      });
      await expect(client.broadcast(tx)).rejects.toThrow(
        "invalid tx_hash length: expected 64 hex chars, got 144",
      );
    });
  });

  describe("txInfo", () => {
    it("sends 64-char hex tx_hash, not base64", async () => {
      const hexHash = "e3d2bc9e38cc02af7e6babe4094a8a8afcf0074cb93151ca8339770ae554f45d";
      postMock.mockResolvedValue({
        status: 200,
        data: {
          jsonrpc: "2.0",
          id: 1,
          result: {
            hash: hexHash,
            height: 1,
            tx: {
              body: {
                payload: bytesToBase64(new Uint8Array([1, 2, 3])),
                fee: "0",
              },
              signature: { sig: bytesToBase64(new Uint8Array([4])) },
              sender: hexHash,
            },
          },
        },
      });

      await client.txInfo(hexHash);
      expect(postMock).toHaveBeenCalledWith(
        "/rpc/v1",
        expect.objectContaining({
          method: "user.tx_query",
          params: { tx_hash: hexHash },
        }),
        undefined,
      );
      expect(postMock.mock.calls[0][1].params.tx_hash).not.toBe(bytesToBase64(hexToBytes(hexHash)));
    });
  });

  describe("call", () => {
    const callMessage = Msg.create((msg) => {
      msg.body.payload = "payload";
    });

    const emptyQueryResult = {
      column_names: [] as string[],
      column_types: [] as { name: string; is_array: boolean }[],
      values: [] as unknown[],
    };

    it("should expose action-level error when CallResult.error is set", async () => {
      postMock.mockResolvedValue({
        status: 200,
        data: {
          jsonrpc: "2.0",
          id: 1,
          result: {
            query_result: emptyQueryResult,
            logs: "some logs",
            error: "Unauthorized gateway",
          },
        },
      });

      const result = await client.call(callMessage);

      expect(result.status).toBe(200);
      expect(result.data?.error).toBe("Unauthorized gateway");
      expect(result.data?.result).toEqual([]);
      expect(result.data?.logs).toBe("some logs");
    });

    it("should return undefined error when CallResult.error is null", async () => {
      postMock.mockResolvedValue({
        status: 200,
        data: {
          jsonrpc: "2.0",
          id: 1,
          result: {
            query_result: emptyQueryResult,
            error: null,
          },
        },
      });

      const result = await client.call(callMessage);

      expect(result.data?.error).toBeUndefined();
      expect(result.data?.result).toEqual([]);
    });

    it("should return undefined error when CallResult.error is absent", async () => {
      postMock.mockResolvedValue({
        status: 200,
        data: {
          jsonrpc: "2.0",
          id: 1,
          result: {
            query_result: emptyQueryResult,
          },
        },
      });

      const result = await client.call(callMessage);

      expect(result.data?.error).toBeUndefined();
      expect(result.data?.result).toEqual([]);
    });

    it("should parse rows when CallResult.error is absent", async () => {
      postMock.mockResolvedValue({
        status: 200,
        data: {
          jsonrpc: "2.0",
          id: 1,
          result: {
            query_result: {
              column_names: ["title"],
              column_types: [{ name: "text", is_array: false }],
              values: [["row1"]],
            },
          },
        },
      });

      const result = await client.call(callMessage);

      expect(result.data?.error).toBeUndefined();
      expect(result.data?.result).toEqual([{ title: "row1" }]);
    });
  });
});
