import { beforeEach, describe, expect, it, vi } from "vitest";

import { getDb } from "@/core/db.server";
import { SESSION_MAX_AGE_SECONDS, sessionStorage } from "@/core/sessions.server";

import { loader } from "./session";

vi.mock("@/core/db.server");

const mockGetDb = vi.mocked(getDb);

async function requestWithSession(issuedAt?: number) {
  const session = await sessionStorage.getSession();
  session.set("userId", "user-1");
  if (issuedAt !== undefined) session.set("issuedAt", issuedAt);
  const cookie = (await sessionStorage.commitSession(session)).split(";")[0];
  return { request: new Request("http://localhost/api/session", { headers: { Cookie: cookie } }) };
}

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
