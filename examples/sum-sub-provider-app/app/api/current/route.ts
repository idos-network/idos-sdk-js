import prisma from "@/app/lib/db";
import { cookies } from "next/headers";
import { auth } from "../../auth";

export async function GET() {
  const cookieStore = await cookies();

  const client = cookieStore.get("client")?.value;

  if (!client) return Response.json({ error: "Client is missing" }, { status: 404 });

  const level = cookieStore.get("level")?.value;
  const publicEncryptionKey = cookieStore.get("publicEncryptionKey")?.value;
  const redirectUri = cookieStore.get("redirectUri")?.value;
  const grantee = cookieStore.get("grantee")?.value;

  // Step /init
  const application = {
    client,
    level,
    publicEncryptionKey,
    redirectUri,
    grantee,
  };

  // Step /wallet
  const currentUser = await auth();

  // Fetch DB data
  const user = await prisma.user.findFirst({
    // @ts-expect-error Not yet fully typed
    where: { address: currentUser?.user?.address },
  });

  // No DB user means that there is no user logged in
  if (!user) {
    return Response.json({ application, loggedIn: false });
  }

  return Response.json({ application, user, loggedIn: !!currentUser });
}
