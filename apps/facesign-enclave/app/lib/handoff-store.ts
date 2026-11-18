import { Redis } from "@upstash/redis";

const SESSION_TTL_SECONDS = 5 * 60; // 5 minutes

// The only Redis the handoff may use. Attestation tokens pass through it, and whoever reads one
// can redeem it for the user's mnemonic, so an environment variable alone must not be able to
// point the store somewhere else. Today one Upstash database serves every environment (keys are
// separated by KV_PREFIX). The dev server (`import.meta.env.DEV`, false in every build) may also
// use a Redis REST endpoint on loopback; see the README.
const ALLOWED_REDIS_HOSTS = new Set(["equal-calf-29258.upstash.io"]);
const LOOPBACK_REDIS_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

export function assertAllowedRedisUrl(raw: string | undefined): string {
  let url: URL;
  try {
    url = new URL(raw ?? "");
  } catch {
    throw new Error("KV_REST_API_URL is missing or not a URL");
  }

  const allowed =
    (url.protocol === "https:" && ALLOWED_REDIS_HOSTS.has(url.hostname)) ||
    (import.meta.env.DEV && LOOPBACK_REDIS_HOSTS.has(url.hostname));
  if (!allowed) {
    throw new Error(`KV_REST_API_URL host "${url.hostname}" is not an allowed handoff store`);
  }

  // The normalized form that passed the check, e.g. a lowercase scheme.
  return url.href;
}

let client: Redis | undefined;

// Created on first use, so a bad KV_REST_API_URL fails the handoff calls, not the whole app.
function redis(): Redis {
  client ??= new Redis({
    url: assertAllowedRedisUrl(process.env.KV_REST_API_URL),
    token: process.env.KV_REST_API_TOKEN ?? "",
  });
  return client;
}

export interface HandoffSession {
  id: string;
  status: "pending" | "completed";
  attestationToken?: string;
  createdAt: number;
}

function sessionKey(id: string): string {
  return `${process.env.KV_PREFIX ?? ""}:handoff:${id}`;
}

export async function createSession(): Promise<HandoffSession> {
  const id = crypto.randomUUID();

  const session: HandoffSession = {
    id,
    status: "pending",
    createdAt: Date.now(),
  };

  await redis().set(sessionKey(id), JSON.stringify(session), { ex: SESSION_TTL_SECONDS });

  return session;
}

export async function getSession(id: string): Promise<HandoffSession | null> {
  const raw = await redis().get<string>(sessionKey(id));
  if (!raw) return null;

  const session: HandoffSession = typeof raw === "string" ? JSON.parse(raw) : raw;

  return session;
}

function tokenKey(id: string): string {
  return `${sessionKey(id)}:token`;
}

// Stored in place of the token once it has been redeemed. The token key itself stays until it
// expires, so it keeps marking the session as completed and every later NX write fails.
const CONSUMED = "consumed";

// Only the first completion wins: the token is written with NX and the key is never deleted
// before it expires, so it can't be overwritten or re-created.
export async function completeSession(id: string, attestationToken: string): Promise<boolean> {
  const ttl = await redis().ttl(sessionKey(id));
  if (ttl <= 0) return false;

  const result = await redis().set(tokenKey(id), attestationToken, { nx: true, ex: ttl });
  return result === "OK";
}

// Returns the token while it hasn't been redeemed yet, without redeeming it.
export async function getAttestationToken(id: string): Promise<string | null> {
  const token = await redis().get<string>(tokenKey(id));
  return token && token !== CONSUMED ? token : null;
}

// Redeems the token at most once (atomic SET XX GET) and drops the session. A repeated call
// retries the session delete in case the first one failed, but never returns the token again.
export async function consumeAttestationToken(id: string): Promise<string | null> {
  const previous = await redis().set<string>(tokenKey(id), CONSUMED, {
    xx: true,
    keepTtl: true,
    get: true,
  });
  if (!previous) return null;

  await deleteSession(id);
  return previous === CONSUMED ? null : previous;
}

export async function sessionExists(id: string): Promise<boolean> {
  const exists = await redis().exists(sessionKey(id));
  return exists === 1;
}

export async function deleteSession(id: string): Promise<void> {
  await redis().del(sessionKey(id));
}
