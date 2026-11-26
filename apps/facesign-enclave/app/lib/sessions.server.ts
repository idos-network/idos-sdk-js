import { createCookieSessionStorage } from "react-router";

export interface Session {
  sessionId: string;
}

export const sessionStorage = createCookieSessionStorage<Session>({
  cookie: {
    // __Host- stops sibling subdomains from planting or shadowing the cookie (session fixation); it requires Secure.
    name: process.env.SECURE_AUTH_COOKIE === "true" ? "__Host-session" : "__session",
    secrets: [process.env.SECRET_KEY_BASE!],
    sameSite: "lax",
    path: "/",
    secure: process.env.SECURE_AUTH_COOKIE === "true",
    httpOnly: true,
  },
});
