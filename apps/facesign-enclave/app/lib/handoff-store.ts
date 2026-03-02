import { Redis } from "@upstash/redis";

const SESSION_TTL_SECONDS = 5 * 60; // 5 minutes

const redis = new Redis({
  url: process.env.KV_REST_API_URL ?? "",
  token: process.env.KV_REST_API_TOKEN ?? "",
});

export interface HandoffSession {
  id: string;
  secret: string;
  status: "pending" | "completed";
  attestationToken?: string;
  createdAt: number;
}

function sessionKey(id: string): string {
  return `handoff:${id}`;
}

export async function createSession(): Promise<{ id: string; secret: string }> {
  const id = crypto.randomUUID();
  const secret = crypto.randomUUID();

  const session: HandoffSession = {
    id,
    secret,
    status: "pending",
    createdAt: Date.now(),
  };

  await redis.set(sessionKey(id), JSON.stringify(session), { ex: SESSION_TTL_SECONDS });

  return { id, secret };
}

export async function getSession(
  id: string,
  secret: string | null,
): Promise<HandoffSession | null> {
  const raw = await redis.get<string>(sessionKey(id));
  if (!raw) return null;

  const session: HandoffSession = typeof raw === "string" ? JSON.parse(raw) : raw;
  if (session.secret !== secret) return null;

  return session;
}

export async function completeSession(id: string, attestationToken: string): Promise<boolean> {
  const raw = await redis.get<string>(sessionKey(id));
  if (!raw) return false;

  const session: HandoffSession = typeof raw === "string" ? JSON.parse(raw) : raw;

  session.status = "completed";
  session.attestationToken = attestationToken;

  const ttl = await redis.ttl(sessionKey(id));
  await redis.set(sessionKey(id), JSON.stringify(session), {
    ex: ttl > 0 ? ttl : SESSION_TTL_SECONDS,
  });

  return true;
}

export async function sessionExists(id: string): Promise<boolean> {
  const exists = await redis.exists(sessionKey(id));
  return exists === 1;
}

export async function deleteSession(id: string): Promise<void> {
  await redis.del(sessionKey(id));
}
