import { Wallet } from "ethers";

import { KwilSigner } from "../../../src";
import { NodeKwil } from "../../../src";
import { ActionBody, ActionInput } from "../../../src/core/action";
import { DeployBody } from "../../../src/core/database";
import { DropBody } from "../../../src/core/database";
import { Msg } from "../../../src/core/message";
import { bytesToBase64 } from "../../../src/utils/base64";
import { stringToBytes, stringToHex } from "../../../src/utils/serial";
import compiledKF from "../../test_schema2.json";
import { getMock, mockedAxios, postMock } from "../api_client/api-utils";

class TestKwil extends NodeKwil {
  constructor() {
    super({ kwilProvider: "doesnt matter", chainId: "doesnt matter" });
  }
}

describe("Kwil", () => {
  let kwil: TestKwil;

  beforeEach(() => {
    kwil = new TestKwil();
    mockedAxios.create.mockClear();
    getMock.mockReset();
    postMock.mockReset();
  });

  const address = "0xAfFDC06cF34aFD7D5801A13d48C92AD39609901D";

  describe("getDBID", () => {
    it("should return the dbid", () => {
      const dbid = kwil.getDBID(address, "mydb");
      expect(dbid).toBe("x52197631a5de74a1e293681181c2a63418d7ae710a3f0370d91a99bd");
    });
  });

  describe("getAccount", () => {
    it("should return account info for a given wallet address", async () => {
      const mockAccount = {
        id: {
          identifier: address,
          key_type: "secp256k1",
        },
        balance: "mockBalance",
        nonce: 123,
      };

      postMock.mockResolvedValue({
        status: 200,
        data: {
          jsonrpc: "2.0",
          id: 1,
          result: mockAccount,
        },
      });

      const result = await kwil.getAccount(address);
      expect(result.status).toBe(200);
      expect(result.data?.id?.identifier).toBe(address);
      expect(result.data?.balance).toBe(mockAccount.balance);
      expect(result.data?.nonce).toBe(mockAccount.nonce);
    });
  });

  describe("KGW cookie session", () => {
    it("should expose the current KGW cookie", () => {
      expect(kwil.getKgwCookie()).toBeUndefined();
    });

    it("should authenticate, store the returned KGW cookie, and attach it to later Node requests", async () => {
      const cookie = "kgw_session=fresh; Path=/";
      const signer = new KwilSigner(
        async () => new Uint8Array([1, 2, 3]),
        new Uint8Array([4, 5, 6]),
        "ed25519",
      );

      postMock
        .mockResolvedValueOnce({
          status: 200,
          data: {
            jsonrpc: "2.0",
            id: 1,
            result: {
              nonce: "123456",
              statement: "",
              issue_at: "2026-05-15T14:30:00Z",
              expiration_time: "2026-05-15T14:35:00Z",
              chain_id: "doesnt matter",
              domain: "doesnt matter",
              version: "1",
              uri: "doesnt matter/auth",
            },
          },
        })
        .mockResolvedValueOnce({
          status: 200,
          headers: {
            "set-cookie": [cookie],
          },
          data: {
            jsonrpc: "2.0",
            id: 2,
            result: {
              result: "authenticated",
            },
          },
        })
        .mockResolvedValueOnce({
          status: 200,
          data: {
            jsonrpc: "2.0",
            id: 3,
            result: {
              id: {
                identifier: address,
                key_type: "secp256k1",
              },
              balance: "mockBalance",
              nonce: 123,
            },
          },
        });

      await expect(kwil.authenticateKGWAndSetCookie(signer)).resolves.toBe(cookie);
      expect(kwil.getKgwCookie()).toBe(cookie);

      await kwil.getAccount(address);

      const createCalls = mockedAxios.create.mock.calls;
      const latestConfig = createCalls[createCalls.length - 1][0];
      const latestHeaders = latestConfig?.headers as Record<string, string> | undefined;

      expect(latestHeaders?.Cookie).toBe(cookie);
    });
  });
});
