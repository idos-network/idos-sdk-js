import { beforeEach, describe, expect, it, vi } from "vitest";

const store = new Map<string, { value: string; expiresAt: number }>();

vi.mock("@upstash/redis", () => ({
  Redis: class {
    async get(key: string) {
      return store.get(key)?.value ?? null;
    }
    async getdel(key: string) {
      const value = store.get(key)?.value ?? null;
      store.delete(key);
      return value;
    }
    async set(key: string, value: string, opts: { ex: number; nx?: boolean }) {
      if (opts.nx && store.has(key)) return null;
      store.set(key, { value, expiresAt: Date.now() + opts.ex * 1000 });
      return "OK";
    }
    async ttl(key: string) {
      const entry = store.get(key);
      return entry ? Math.ceil((entry.expiresAt - Date.now()) / 1000) : -2;
    }
    async exists(key: string) {
      return store.has(key) ? 1 : 0;
    }
    async del(key: string) {
      return store.delete(key) ? 1 : 0;
    }
  },
}));

const { completeSession, consumeAttestationToken, createSession, getSession } =
  await import("./handoff-store");

describe("handoff-store", () => {
  beforeEach(() => store.clear());

  it("completes a session only once and keeps the first token", async () => {
    const { id } = await createSession();

    expect(await completeSession(id, "victim-token")).toBe(true);
    expect(await completeSession(id, "attacker-token")).toBe(false);

    expect(await consumeAttestationToken(id)).toBe("victim-token");
  });

  it("hands out the token once and then drops the session", async () => {
    const { id } = await createSession();
    await completeSession(id, "token");

    expect(await consumeAttestationToken(id)).toBe("token");
    expect(await consumeAttestationToken(id)).toBeNull();
    expect(await getSession(id)).toBeNull();
    expect(await completeSession(id, "late-token")).toBe(false);
  });

  it("rejects completing an unknown session", async () => {
    expect(await completeSession(crypto.randomUUID(), "token")).toBe(false);
  });
});
