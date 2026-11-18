import { createCookieSessionStorage, type Session as RouterSession } from "react-router";

import { SERVER_ENV } from "./envFlags.server";

export interface Session {
  // Profile creation & developer console
  proofMessage: string;

  // Developer console
  userId: string;
  // Login time (ms), sessions older than SESSION_MAX_AGE_SECONDS are rejected
  issuedAt: number;

  // Profile creation
  profileUserId: string;
  walletNotBefore: string;
  walletNotAfter: string;
}

export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24;

export const sessionStorage = createCookieSessionStorage<Session>({
  cookie: {
    name: "__session",
    secrets: [SERVER_ENV.SECRET_KEY_BASE],
    sameSite: "lax",
    path: "/",
    secure: SERVER_ENV.SECURE_AUTH_COOKIE,
    httpOnly: true,
    maxAge: SESSION_MAX_AGE_SECONDS,
  },
});

// Returns the developer console user, or undefined when not logged in or the login is expired.
// The cookie maxAge alone is not enough: every commitSession re-extends it.
export function getUserId(session: RouterSession<Session>): string | undefined {
  const issuedAt = session.get("issuedAt");
  if (typeof issuedAt !== "number" || !Number.isFinite(issuedAt)) {
    return undefined;
  }
  const ageMs = Date.now() - issuedAt;
  if (ageMs < 0 || ageMs > SESSION_MAX_AGE_SECONDS * 1000) {
    return undefined;
  }
  return session.get("userId");
}
