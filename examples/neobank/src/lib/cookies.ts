import { cookies } from "next/headers";

export interface UserData {
  userId: string | null;
  userAddress: string | null;
}

export const setCookieValue = async (key: string, value: string) => {
  const cookieStore = await cookies();

  cookieStore.set(key, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });
};

export async function getUserFromCookies(): Promise<UserData> {
  const cookieStore = await cookies();

  const userId = cookieStore.get("userId")?.value || null;
  const userAddress = cookieStore.get("userAddress")?.value || null;

  return { userId, userAddress };
}

export async function clearUserCookies(): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.delete("userId");
  cookieStore.delete("userAddress");
}
