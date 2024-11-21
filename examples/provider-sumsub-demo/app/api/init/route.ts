import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const { client, level, redirectUri, publicEncryptionKey, grantee } = await request.json();
  const cookieStore = await cookies();

  if (!client || !level || !redirectUri) {
    return Response.json({ error: "Client id, level, redirectUri are required." }, { status: 400 });
  }

  cookieStore.set("client", client, { httpOnly: true });
  cookieStore.set("level", level, { httpOnly: true });
  cookieStore.set("redirectUri", redirectUri, { httpOnly: true });
  cookieStore.set("publicEncryptionKey", publicEncryptionKey, { httpOnly: true });
  cookieStore.set("grantee", grantee, { httpOnly: true });

  return Response.json({}, { status: 202 });
}
