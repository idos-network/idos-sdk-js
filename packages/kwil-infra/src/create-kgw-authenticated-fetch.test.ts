import { type KwilSigner, NodeKwil } from "@idos-network/kwil-js";
import { describe, expect, it, vi } from "vitest";

import { createKgwAuthenticatedFetch } from "./create-kgw-authenticated-fetch";
import { KwilActionClient } from "./create-kwil-client";

function createTestClient(initialCookie?: string): {
  authFetch: typeof fetch;
  fetchFn: ReturnType<typeof vi.fn<typeof fetch>>;
  refresh: ReturnType<typeof vi.fn<() => Promise<string>>>;
} {
  let cookie = initialCookie;
  const nodeKwil = new NodeKwil({
    kwilProvider: "https://nodes.example",
    chainId: "test-chain",
  }) as NodeKwil & {
    authenticateKGWAndSetCookie: ReturnType<typeof vi.fn<() => Promise<string>>>;
    getKgwCookie: ReturnType<typeof vi.fn<() => string | undefined>>;
  };
  const kwilClient = new KwilActionClient(nodeKwil);
  const refresh = vi.fn(async () => {
    cookie = "kgw_session=fresh; Path=/";
    return cookie;
  });
  const fetchFn = vi.fn<typeof fetch>(async () => new Response("ok"));

  nodeKwil.getKgwCookie = vi.fn(() => cookie);
  nodeKwil.authenticateKGWAndSetCookie = refresh;

  return {
    authFetch: createKgwAuthenticatedFetch({
      kwilClient,
      signer: {} as KwilSigner,
      fetchFn,
    }),
    fetchFn,
    refresh,
  };
}

function cookieHeader(call: Parameters<typeof fetch>): string | null {
  const init = call[1];
  return new Headers(init?.headers).get("cookie");
}

describe("createKgwAuthenticatedFetch", () => {
  it("authenticates before the first request when there is no cookie", async () => {
    const { authFetch, fetchFn, refresh } = createTestClient();

    await authFetch("https://blob.example/upload", { method: "POST" });

    expect(refresh).toHaveBeenCalledTimes(1);
    expect(fetchFn).toHaveBeenCalledTimes(1);
    expect(cookieHeader(fetchFn.mock.calls[0])).toBe("kgw_session=fresh; Path=/");
  });

  it("attaches an existing cookie without refreshing", async () => {
    const { authFetch, fetchFn, refresh } = createTestClient("kgw_session=existing; Path=/");

    await authFetch("https://blob.example/upload", {
      headers: { "x-request-id": "request-1" },
    });

    const headers = new Headers(fetchFn.mock.calls[0]?.[1]?.headers);
    expect(refresh).not.toHaveBeenCalled();
    expect(headers.get("cookie")).toBe("kgw_session=existing; Path=/");
    expect(headers.get("x-request-id")).toBe("request-1");
  });

  it("refreshes and retries once after an auth failure", async () => {
    const { authFetch, fetchFn, refresh } = createTestClient("kgw_session=expired; Path=/");
    fetchFn
      .mockResolvedValueOnce(new Response("unauthorized", { status: 401 }))
      .mockResolvedValueOnce(new Response("ok"));

    const response = await authFetch("https://blob.example/upload");

    expect(response.ok).toBe(true);
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(fetchFn).toHaveBeenCalledTimes(2);
    expect(cookieHeader(fetchFn.mock.calls[0])).toBe("kgw_session=expired; Path=/");
    expect(cookieHeader(fetchFn.mock.calls[1])).toBe("kgw_session=fresh; Path=/");
  });

  it("returns the retry response when authentication keeps failing", async () => {
    const { authFetch, fetchFn, refresh } = createTestClient("kgw_session=expired; Path=/");
    fetchFn
      .mockResolvedValueOnce(new Response("unauthorized", { status: 401 }))
      .mockResolvedValueOnce(new Response("still unauthorized", { status: 401 }));

    const response = await authFetch("https://blob.example/upload");

    expect(response.status).toBe(401);
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });

  it("does not reauthenticate on forbidden responses", async () => {
    const { authFetch, fetchFn, refresh } = createTestClient("kgw_session=valid; Path=/");
    fetchFn.mockResolvedValueOnce(new Response("forbidden", { status: 403 }));

    const response = await authFetch("https://blob.example/upload");

    expect(response.status).toBe(403);
    expect(refresh).not.toHaveBeenCalled();
    expect(fetchFn).toHaveBeenCalledTimes(1);
    expect(cookieHeader(fetchFn.mock.calls[0])).toBe("kgw_session=valid; Path=/");
  });

  it("shares one refresh across parallel auth failures", async () => {
    const { authFetch, fetchFn, refresh } = createTestClient("kgw_session=expired; Path=/");
    fetchFn
      .mockResolvedValueOnce(new Response("unauthorized", { status: 401 }))
      .mockResolvedValueOnce(new Response("unauthorized", { status: 401 }))
      .mockResolvedValueOnce(new Response("ok"))
      .mockResolvedValueOnce(new Response("ok"));

    const [first, second] = await Promise.all([
      authFetch("https://blob.example/upload-a"),
      authFetch("https://blob.example/upload-b"),
    ]);

    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(fetchFn).toHaveBeenCalledTimes(4);
    expect(cookieHeader(fetchFn.mock.calls[2])).toBe("kgw_session=fresh; Path=/");
    expect(cookieHeader(fetchFn.mock.calls[3])).toBe("kgw_session=fresh; Path=/");
  });

  it("detects KGW-shaped JSON auth errors", async () => {
    const { authFetch, fetchFn, refresh } = createTestClient("kgw_session=wrong; Path=/");
    fetchFn
      .mockResolvedValueOnce(
        Response.json({ error: { code: -901, message: "auth required" } }, { status: 200 }),
      )
      .mockResolvedValueOnce(new Response("ok"));

    await authFetch("https://blob.example/upload");

    expect(refresh).toHaveBeenCalledTimes(1);
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });
});
