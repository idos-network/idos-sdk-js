import "server-only";

import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";

type User = {
  address: string;
  message: string;
  signature?: string;
  isAuthenticated: boolean;
};

type SessionPayload = {
  user: User;
  returnTo?: string;
  noahCheckoutSessionID?: string;
  hifiTosId?: string;
  hifiUserId?: string;
};

const secretKey = process.env.SESSION_SECRET;
const encodedKey = new TextEncoder().encode(secretKey);

export async function encrypt(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(encodedKey);
}

export async function decrypt(session: string | undefined = "") {
  try {
    const { payload } = await jwtVerify(session, encodedKey, {
      algorithms: ["HS256"],
    });
    return payload;
  } catch (_error) {
    console.log("Failed to verify session");
  }
}

export async function createSession(user: User) {
  const session = await encrypt({ user });
  const cookieStore = await cookies();

  cookieStore.set("session", session, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
  });
}
