import { createCookieSessionStorage } from "react-router";
import type { SessionUser } from "../interfaces";

import { SERVER_ENV } from "./envFlags.server";

export interface Session {
  user: SessionUser;
  returnTo?: string;
  noahCheckoutSessionID?: string;
  hifiTosId?: string;
  hifiUserId?: string;
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
