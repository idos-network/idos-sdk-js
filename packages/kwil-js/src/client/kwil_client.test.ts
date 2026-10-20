import { beforeEach, describe, expect, it, vi } from "vitest";

import { getMock, mockedAxios, postMock } from "../api_client/axios.mock";
import { KwilSigner } from "../index";
import { NodeKwil } from "../index";

vi.mock("axios", async () => (await import("../api_client/axios.mock")).axiosModuleMock);

class TestKwil extends NodeKwil {
  constructor() {
    super({ kwilProvider: "does not matter", chainId: "does not matter" });
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
              chain_id: "does not matter",
              domain: "does not matter",
              version: "1",
              uri: "does not matter/auth",
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

    it("sends a call cookie only on that request", async () => {
      const override = "kgw_session=override";
      postMock
        .mockResolvedValueOnce({
          status: 200,
          data: { jsonrpc: "2.0", id: 1, result: { mode: "open" } },
        })
        .mockRejectedValueOnce(new Error("network down"));

      await expect(
        kwil.call({ namespace: "main", name: "read", cookie: override }),
      ).rejects.toThrow("network down");

      expect(kwil.getKgwCookie()).toBeUndefined();
      expect(postConfigCookie(postMock.mock.calls[1])).toBe(override);
      expect(instanceCookies()).not.toContain(override);
    });

    it("retries KGW auth with the session cookie, not the call cookie", async () => {
      const override = "kgw_session=override";
      const session = "kgw_session=fresh; Path=/";
      const signer = new KwilSigner(
        async () => new Uint8Array([1, 2, 3]),
        new Uint8Array([4, 5, 6]),
        "ed25519",
      );
      const queryResult = { column_names: [], column_types: [], values: [] };

      postMock
        .mockResolvedValueOnce({
          status: 200,
          data: { jsonrpc: "2.0", id: 1, result: { mode: "open" } },
        })
        .mockResolvedValueOnce({
          status: 200,
          data: { jsonrpc: "2.0", id: 2, error: { code: -901, message: "kgw" } },
        })
        .mockResolvedValueOnce({
          status: 200,
          data: {
            jsonrpc: "2.0",
            id: 3,
            result: {
              nonce: "123456",
              statement: "",
              issue_at: "2026-05-15T14:30:00Z",
              expiration_time: "2026-05-15T14:35:00Z",
              chain_id: "does not matter",
              domain: "does not matter",
              version: "1",
              uri: "does not matter/auth",
            },
          },
        })
        .mockResolvedValueOnce({
          status: 200,
          headers: { "set-cookie": [session] },
          data: { jsonrpc: "2.0", id: 4, result: { result: "authenticated" } },
        })
        .mockResolvedValueOnce({
          status: 200,
          data: { jsonrpc: "2.0", id: 5, result: { query_result: queryResult } },
        });

      await kwil.call({ namespace: "main", name: "read", cookie: override }, signer);

      const calls = postMock.mock.calls.filter((call) => call[1]?.method === "user.call");
      expect(calls).toHaveLength(2);
      expect(postConfigCookie(calls[0])).toBe(override);
      expect(postConfigCookie(calls[1])).toBeUndefined();
      expect(kwil.getKgwCookie()).toBe(session);
      expect(instanceCookies().at(-1)).toBe(session);
    });
  });
});

function postConfigCookie(call: unknown[]): string | undefined {
  const config = call[2] as { headers?: { Cookie?: string } } | undefined;
  return config?.headers?.Cookie;
}

function instanceCookies(): (string | undefined)[] {
  return mockedAxios.create.mock.calls.map((call) => {
    const headers = (call[0] as { headers?: { Cookie?: string } } | undefined)?.headers;
    return headers?.Cookie;
  });
}
