// @vitest-environment node

import { type KwilSigner, NodeKwil } from "@idos-network/kwil-js";
import { base64UrlEncode, utf8Encode } from "@idos-network/utils/codecs";
import { describe, expect, it, vi } from "vitest";

import {
  createKgwAuthenticatedBlobGateway,
  createKgwAuthenticatedFetch,
} from "./create-kgw-authenticated-fetch";
import { KwilActionClient } from "./create-kwil-client";
import { createMmTokenAuth } from "./mm-token/create-mm-token-kwil-signer";

const mmEnvelopeToken = base64UrlEncode(
  utf8Encode(
    JSON.stringify({
      payload: {
        signing_public_key: base64UrlEncode(new Uint8Array(32).fill(7)),
        storage_id: "storage-abc",
      },
      signature: base64UrlEncode(new Uint8Array(64).fill(9)),
    }),
  ),
);

function createTestClient(
  initialCookie?: string,
  params?: { isAuthFailure?: (response: Response) => Promise<boolean> | boolean },
): {
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

  const authFetchParams: Parameters<typeof createKgwAuthenticatedFetch>[0] = {
    kwilClient,
    signer: {} as KwilSigner,
    fetchFn,
  };
  if (params?.isAuthFailure) {
    authFetchParams.isAuthFailure = params.isAuthFailure;
  }

  return {
    authFetch: createKgwAuthenticatedFetch(authFetchParams),
    fetchFn,
    refresh,
  };
}

async function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timeout = setTimeout(() => reject(new Error(message)), ms);
      }),
    ]);
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }
}

function cookieHeader(call: Parameters<typeof fetch>): string | null {
  const init = call[1];
  return new Headers(init?.headers).get("cookie");
}

async function readFormDataValue(value: FormDataEntryValue | null): Promise<string> {
  if (value == null) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  return new TextDecoder().decode(await new Response(value).arrayBuffer());
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

  it("retries blob uploads with the same FormData body after an auth failure", async () => {
    const { authFetch, fetchFn, refresh } = createTestClient("kgw_session=expired; Path=/");
    const receivedBodies: FormData[] = [];

    fetchFn.mockImplementation(async (_input, init) => {
      const body = init?.body as FormData;
      receivedBodies.push(body);

      // Simulate fetch consuming multipart bodies on the first attempt.
      await readFormDataValue(body.get("original"));

      if (fetchFn.mock.calls.length === 1) {
        return new Response("unauthorized", { status: 401 });
      }

      return new Response("ok");
    });

    const formData = new FormData();
    formData.append(
      "original",
      new Blob(["blob-bytes"], { type: "application/octet-stream" }),
      "original.blob",
    );
    formData.append("duplicate", new Blob(["first"]), "first.blob");
    formData.append("duplicate", new Blob(["second"]), "second.blob");

    const response = await authFetch("https://blob.example/upload", {
      method: "POST",
      body: formData,
    });

    expect(response.ok).toBe(true);
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(fetchFn).toHaveBeenCalledTimes(2);
    expect(receivedBodies).toHaveLength(2);

    const firstEntry = receivedBodies[0]?.get("original");
    const secondEntry = receivedBodies[1]?.get("original");

    expect(firstEntry).toBeTruthy();
    expect(secondEntry).toBeTruthy();
    expect(await readFormDataValue(firstEntry)).toBe("blob-bytes");
    expect(await readFormDataValue(secondEntry)).toBe("blob-bytes");
    await expect(
      Promise.all(receivedBodies[1]?.getAll("duplicate").map(readFormDataValue) ?? []),
    ).resolves.toEqual(["first", "second"]);
  });

  it("retries Request-input bodies after an auth failure without locking the original", async () => {
    const { authFetch, fetchFn, refresh } = createTestClient("kgw_session=expired; Path=/");
    const receivedBodies: string[] = [];

    fetchFn.mockImplementation(async (_input, init) => {
      const body = init?.body;
      receivedBodies.push(
        body instanceof ArrayBuffer ? new TextDecoder().decode(body) : String(body),
      );

      if (fetchFn.mock.calls.length === 1) {
        return new Response("unauthorized", { status: 401 });
      }

      return new Response("ok");
    });

    const request = new Request("https://blob.example/upload", {
      method: "POST",
      body: "request-body",
    });
    const response = await authFetch(request);

    expect(response.ok).toBe(true);
    expect(request.bodyUsed).toBe(false);
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(fetchFn).toHaveBeenCalledTimes(2);
    expect(receivedBodies).toEqual(["request-body", "request-body"]);
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

  // Regression: JSON 401 used to clone for the auth probe, then cancel the
  // original while the clone tee stayed unread — undici hangs on that cancel.
  it("retries after a JSON 401 without hanging on body cancel", async () => {
    const { authFetch, fetchFn, refresh } = createTestClient("kgw_session=expired; Path=/");
    fetchFn
      .mockResolvedValueOnce(Response.json({ error: "unauthorized" }, { status: 401 }))
      .mockResolvedValueOnce(new Response("ok"));

    const response = await withTimeout(
      authFetch("https://blob.example/upload"),
      1000,
      "hung discarding 401 body",
    );

    expect(response.ok).toBe(true);
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });

  it("discards both tee branches when a custom predicate flags unread JSON", async () => {
    const { authFetch, fetchFn, refresh } = createTestClient("kgw_session=expired; Path=/", {
      isAuthFailure: (response) => response.status === 419,
    });
    fetchFn
      .mockResolvedValueOnce(Response.json({ error: "session expired" }, { status: 419 }))
      .mockResolvedValueOnce(new Response("ok"));

    const response = await withTimeout(
      authFetch("https://blob.example/upload"),
      1000,
      "hung discarding cloned JSON body",
    );

    expect(response.ok).toBe(true);
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(fetchFn).toHaveBeenCalledTimes(2);
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

  it("leaves a non-JSON success body readable after the auth probe", async () => {
    const { authFetch, fetchFn, refresh } = createTestClient("kgw_session=valid; Path=/");
    const payload = new Uint8Array(1024 * 64).map((_, i) => i % 256);
    fetchFn.mockResolvedValueOnce(
      new Response(payload, {
        status: 200,
        headers: { "content-type": "application/octet-stream" },
      }),
    );

    const response = await authFetch("https://blob.example/download");
    const body = new Uint8Array(await response.arrayBuffer());

    expect(refresh).not.toHaveBeenCalled();
    expect(body).toEqual(payload);
  });
});

describe("createKgwAuthenticatedBlobGateway", () => {
  function kgwSessionClient(): KwilActionClient {
    const nodeKwil = new NodeKwil({
      kwilProvider: "https://nodes.example",
      chainId: "test-chain",
    }) as NodeKwil & {
      authenticateKGWAndSetCookie: () => Promise<string>;
      getKgwCookie: () => string | undefined;
    };
    nodeKwil.getKgwCookie = () => "kgw_session=valid; Path=/";
    nodeKwil.authenticateKGWAndSetCookie = async () => "kgw_session=valid; Path=/";

    return new KwilActionClient(nodeKwil);
  }

  it("infers UKYC authorization from an MM signer", () => {
    const gateway = createKgwAuthenticatedBlobGateway({
      url: "https://blob.example",
      kwilClient: kgwSessionClient(),
      signer: createMmTokenAuth(mmEnvelopeToken),
    });

    expect(gateway.hasAccessToken).toBe(true);
  });

  it("accepts an explicit MM authority for a non-MM signer, and none otherwise", () => {
    const kwilClient = kgwSessionClient();
    const signer = {} as KwilSigner;

    expect(
      createKgwAuthenticatedBlobGateway({
        url: "https://blob.example",
        kwilClient,
        signer,
        mmAuth: createMmTokenAuth(mmEnvelopeToken),
      }).hasAccessToken,
    ).toBe(true);
    expect(
      createKgwAuthenticatedBlobGateway({ url: "https://blob.example", kwilClient, signer })
        .hasAccessToken,
    ).toBe(false);
  });
});
