import { createCookieSessionStorage } from "react-router";
import type { SessionUser } from "../interfaces";

import { SERVER_ENV } from "./envFlags.server";

export const sessionStorage = createCookieSessionStorage<{ user: SessionUser; returnTo?: string }>({
  cookie: {
    name: "__session",
    secrets: [SERVER_ENV.SECRET_KEY_BASE],
    sameSite: "lax",
    path: "/",
    secure: SERVER_ENV.SECURE_AUTH_COOKIE,
    httpOnly: true,
  },
});
