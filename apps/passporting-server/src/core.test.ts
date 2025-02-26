import { describe, expect, test, vi } from "vitest";
import app from "./core.ts";

describe("passporting-server", () => {
  const mockEnv = {
    KWIL_NODE_URL: "http://test-node.url",
    ISSUER_SIGNING_SECRET_KEY: Buffer.from("test-signing-key").toString("base64"),
    ISSUER_ENCRYPTION_SECRET_KEY: Buffer.from("test-encryption-key").toString("base64"),
    CLIENT_SECRETS: "test-secret-1,test-secret-2",
  };

  const mockValidDAGPayload = {
    dag_data_id: "123e4567-e89b-12d3-a456-426614174000",
    dag_owner_wallet_identifier: "0x123",
    dag_grantee_wallet_identifier: "0x456",
    dag_signature: "test-signature",
    dag_locked_until: 1735689600,
    dag_content_hash: "test-hash",
  };

  test("GET / returns rocket emoji", async () => {
    const res = await app.request("/", {
      method: "GET",
    });

    expect(res.status).toBe(200);
    expect(await res.text()).toBe("🚀");
  });

  describe("auth middleware", () => {
    test("rejects requests without authorization header", async () => {
      const res = await app.request("/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(mockValidDAGPayload),
      });

      expect(res.status).toBe(401);
      expect(await res.json()).toEqual({
        success: false,
        error: { message: "Unauthorized request" },
      });
    });

    test("rejects requests with invalid bearer token", async () => {
      const res = await app.request("/", {
        method: "POST",
        headers: {
          Authorization: "Bearer invalid-token",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(mockValidDAGPayload),
      });
      expect(res.status).toBe(401);
      expect(await res.json()).toEqual({
        success: false,
        error: { message: "Unauthorized request" },
      });
    });
  });

  describe("POST /mos-endpoint", () => {
    test("works when the credential is there", async () => {
      const mockCompliantCredential = {
        id: "test-credential-id",
        type: "test-credential",
      };

      vi.mock("@idos-network/consumer-sdk-js/server", () => ({
        idOSGrantee: {
          init: vi.fn().mockResolvedValue({
            getReusableCredentialCompliantly: vi.fn().mockResolvedValue({
              id: "test-credential-id",
              type: "test-credential",
            }),
          }),
        },
      }));

      const res = await app.request("/mos-endpoint", {
        method: "POST",
        headers: {
          Authorization: "Bearer test-secret-1",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(mockValidDAGPayload),
      });

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ credential: mockCompliantCredential });
    });
  });

  describe("POST /", () => {
    test("handles successful credential retrieval", async () => {
      vi.mock("@idos-network/issuer-sdk-js/server", () => ({
        createIssuerConfig: vi.fn().mockResolvedValue({}),
        createAccessGrantFromDAG: vi.fn().mockResolvedValue({}),
      }));

      const res = await app.request("/", {
        method: "POST",
        headers: {
          Authorization: "Bearer test-secret-1",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(mockValidDAGPayload),
      });

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ dag_data_id: mockValidDAGPayload.dag_data_id });
    });

    test("handles validation errors", async () => {
      const res = await app.request("/", {
        method: "POST",
        headers: {
          Authorization: "Bearer test-secret-1",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...mockValidDAGPayload,
          dag_data_id: "not-a-uuid", // Invalid UUID format
        }),
      });

      expect(res.status).toBe(400);
      expect((await res.json()).error.name).toBe("ZodError");
    });
  });
});
