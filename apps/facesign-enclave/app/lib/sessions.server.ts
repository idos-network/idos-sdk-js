import { createCookieSessionStorage } from "react-router";

export interface Session {
  sessionId: string;
}

export const sessionStorage = createCookieSessionStorage<Session>({
  cookie: {
    name: "__session",
    secrets: [process.env.SECRET_KEY_BASE!],
    sameSite: "lax",
    path: "/",
    secure: process.env.SECURE_AUTH_COOKIE === "true",
    httpOnly: true,
  },
});
