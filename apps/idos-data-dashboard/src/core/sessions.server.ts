import { createCookieSessionStorage } from "react-router";

import { SERVER_ENV } from "./envFlags.server";

export interface Session {
  proofMessage: string;
  userId: string;
}

export const sessionStorage = createCookieSessionStorage<Session>({
  cookie: {
    name: "__session",
    secrets: [SERVER_ENV.SECRET_KEY_BASE],
    sameSite: "lax",
    path: "/",
    secure: SERVER_ENV.SECURE_AUTH_COOKIE,
    httpOnly: true,
  },
});
