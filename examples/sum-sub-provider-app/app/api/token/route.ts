import { createAccessToken } from "@/app/lib/sumSub";
import { cookies } from "next/headers";
import { auth } from "../../auth";

export async function POST() {
  const cookieStore = await cookies();

  const level = cookieStore.get("level")?.value;
  if (!level) return Response.json({ error: "Level is missing" }, { status: 404 });

  const currentUser = await auth();
  if (!currentUser?.user)
    return Response.json({ error: "User is not authenticated" }, { status: 401 });

  // @ts-expect-error Not yet fully typed
  const sumSubToken = await createAccessToken(currentUser.user.address, level ?? "basic+liveness");

  return Response.json({ token: sumSubToken });
}
