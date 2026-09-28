import { Redis } from "@upstash/redis";

const SESSION_TTL_SECONDS = 5 * 60; // 5 minutes

const redis = new Redis({
  url: process.env.KV_REST_API_URL ?? "",
  token: process.env.KV_REST_API_TOKEN ?? "",
});

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

  await redis.set(sessionKey(id), JSON.stringify(session), { ex: SESSION_TTL_SECONDS });

  return session;
}

export async function getSession(id: string): Promise<HandoffSession | null> {
  const raw = await redis.get<string>(sessionKey(id));
  if (!raw) return null;

  const session: HandoffSession = typeof raw === "string" ? JSON.parse(raw) : raw;

  return session;
}

function tokenKey(id: string): string {
  return `${sessionKey(id)}:token`;
}

// Only the first completion wins: the token is written with NX, so it can't be overwritten.
export async function completeSession(id: string, attestationToken: string): Promise<boolean> {
  const ttl = await redis.ttl(sessionKey(id));
  if (ttl <= 0) return false;

  const result = await redis.set(tokenKey(id), attestationToken, { nx: true, ex: ttl });
  return result === "OK";
}

// Returns the token at most once and drops the session, so it can't be read or completed again.
export async function consumeAttestationToken(id: string): Promise<string | null> {
  const token = await redis.getdel<string>(tokenKey(id));
  if (token) await deleteSession(id);
  return token;
}

export async function sessionExists(id: string): Promise<boolean> {
  const exists = await redis.exists(sessionKey(id));
  return exists === 1;
}

export async function deleteSession(id: string): Promise<void> {
  await redis.del(sessionKey(id));
}
