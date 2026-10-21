import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getDb } from "@/core/db.server";
import { getUserId, SESSION_MAX_AGE_SECONDS, sessionStorage } from "@/core/sessions.server";

import { loader } from "./session";

vi.mock("@/core/db.server");

const mockGetDb = vi.mocked(getDb);
const NOW = new Date("2026-01-15T00:00:00.000Z");

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

async function requestWithSession(issuedAt?: number) {
  const session = await sessionStorage.getSession();
  session.set("userId", "user-1");
  if (issuedAt !== undefined) session.set("issuedAt", issuedAt);
  const cookie = (await sessionStorage.commitSession(session)).split(";")[0];
  return { request: new Request("http://localhost/api/session", { headers: { Cookie: cookie } }) };
}

describe("getUserId", () => {
  function sessionWith(issuedAt: unknown, userId: unknown = "user-1") {
    return {
      get(key: string) {
        if (key === "issuedAt") return issuedAt;
        if (key === "userId") return userId;
        return undefined;
      },
    } as never;
  }

  it("returns the user id when issuedAt is within the max age", () => {
    expect(getUserId(sessionWith(Date.now() - 1_000))).toBe("user-1");
  });

  it("rejects a non-finite issuedAt", () => {
    expect(getUserId(sessionWith(Number.POSITIVE_INFINITY))).toBeUndefined();
    expect(getUserId(sessionWith(Number.NaN))).toBeUndefined();
    expect(getUserId(sessionWith("1710000000000"))).toBeUndefined();
  });

  it("rejects a future issuedAt", () => {
    expect(getUserId(sessionWith(Date.now() + 60_000))).toBeUndefined();
  });

  it("rejects an issuedAt older than the max age", () => {
    const stale = Date.now() - (SESSION_MAX_AGE_SECONDS * 1000 + 1);
    expect(getUserId(sessionWith(stale))).toBeUndefined();
  });
});

describe("/api/session loader", () => {
  const mockFindUnique = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockFindUnique.mockResolvedValue({
      acceptedTermsAndConditions: true,
      relayPrivateKey: null,
      consumerAuthKey: null,
      consumerEncKey: null,
      relayClientId: null,
    });
    mockGetDb.mockReturnValue({
      user: { findUnique: mockFindUnique },
    } as unknown as ReturnType<typeof getDb>);
  });

  it("accepts a fresh session", async () => {
    const response = await loader((await requestWithSession(Date.now())) as never);
    expect(response.status).toBe(200);
  });

  it("rejects a session issued longer ago than the max age", async () => {
    const stale = Date.now() - (SESSION_MAX_AGE_SECONDS + 60) * 1000;
    const response = await loader((await requestWithSession(stale)) as never);
    expect(response.status).toBe(401);
    expect(mockFindUnique).not.toHaveBeenCalled();
  });

  it("rejects a legacy session without issuedAt", async () => {
    const response = await loader((await requestWithSession()) as never);
    expect(response.status).toBe(401);
  });
});
