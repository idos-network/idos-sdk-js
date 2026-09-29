import { beforeEach, describe, expect, it, vi } from "vitest";

const store = new Map<string, { value: string; expiresAt: number }>();
// Runs right before a DEL, to force an operation to interleave with consumeAttestationToken.
let beforeDel: (() => Promise<void>) | null = null;

vi.mock("@upstash/redis", () => ({
  Redis: class {
    async get(key: string) {
      return store.get(key)?.value ?? null;
    }
    async set(
      key: string,
      value: string,
      opts: { ex?: number; nx?: boolean; xx?: boolean; keepTtl?: boolean; get?: boolean },
    ) {
      const existing = store.get(key);
      if ((opts.nx && existing) || (opts.xx && !existing)) return null;
      const expiresAt =
        opts.keepTtl && existing ? existing.expiresAt : Date.now() + opts.ex! * 1000;
      store.set(key, { value, expiresAt });
      return opts.get ? (existing?.value ?? null) : "OK";
    }
    async ttl(key: string) {
      const entry = store.get(key);
      return entry ? Math.ceil((entry.expiresAt - Date.now()) / 1000) : -2;
    }
    async exists(key: string) {
      return store.has(key) ? 1 : 0;
    }
    async del(key: string) {
      await beforeDel?.();
      return store.delete(key) ? 1 : 0;
    }
  },
}));

const { completeSession, consumeAttestationToken, createSession, getAttestationToken, getSession } =
  await import("./handoff-store");

describe("handoff-store", () => {
  beforeEach(() => {
    store.clear();
    beforeDel = null;
  });

  it("completes a session only once and keeps the first token", async () => {
    const { id } = await createSession();

    expect(await completeSession(id, "victim-token")).toBe(true);
    expect(await completeSession(id, "attacker-token")).toBe(false);

    expect(await consumeAttestationToken(id)).toBe("victim-token");
  });

  it("keeps the token readable until it is redeemed, so a lost response can be retried", async () => {
    const { id } = await createSession();
    await completeSession(id, "token");

    expect(await getAttestationToken(id)).toBe("token");
    expect(await getAttestationToken(id)).toBe("token");
  });

  it("redeems the token once and then drops the session", async () => {
    const { id } = await createSession();
    await completeSession(id, "token");

    expect(await consumeAttestationToken(id)).toBe("token");
    expect(await consumeAttestationToken(id)).toBeNull();
    expect(await getAttestationToken(id)).toBeNull();
    expect(await getSession(id)).toBeNull();
    expect(await completeSession(id, "late-token")).toBe(false);
  });

  it("redeems the token for only one of two concurrent calls", async () => {
    const { id } = await createSession();
    await completeSession(id, "token");

    const results = await Promise.all([consumeAttestationToken(id), consumeAttestationToken(id)]);

    expect(results.filter((token) => token === "token")).toHaveLength(1);
    expect(results.filter((token) => token === null)).toHaveLength(1);
  });

  it("retries the session delete on a repeated redemption", async () => {
    const { id } = await createSession();
    await completeSession(id, "token");

    beforeDel = async () => {
      beforeDel = null;
      throw new Error("network");
    };
    await expect(consumeAttestationToken(id)).rejects.toThrow("network");
    expect(await getSession(id)).not.toBeNull();

    expect(await consumeAttestationToken(id)).toBeNull();
    expect(await getSession(id)).toBeNull();
  });

  it("rejects a completion that runs while the token is being redeemed", async () => {
    const { id } = await createSession();
    await completeSession(id, "token");

    let interleaved: boolean | undefined;
    beforeDel = async () => {
      beforeDel = null;
      // The token has been redeemed, but the session still exists.
      interleaved = await completeSession(id, "attacker-token");
    };

    expect(await consumeAttestationToken(id)).toBe("token");
    expect(interleaved).toBe(false);
    expect(await getAttestationToken(id)).toBeNull();
  });

  it("rejects completing an unknown session", async () => {
    expect(await completeSession(crypto.randomUUID(), "token")).toBe(false);
  });
});
