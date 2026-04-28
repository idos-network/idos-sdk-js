import { getDb } from "@/core/db.server";
import { sessionStorage } from "@/core/sessions.server";

import type { Route } from "./+types/session";

export async function loader({ request }: Route.LoaderArgs) {
  const session = await sessionStorage.getSession(request.headers.get("Cookie"));

  if (!session.get("userId")) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  const user = await getDb().user.findUnique({
    where: {
      id: session.get("userId"),
    },
  });

  if (!user) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  return Response.json(
    {
      userId: session.get("userId"),
      hasKeys: user.relayPrivateKey !== null,
      relayClientId: user.relayClientId,
    },
    {
      headers: {
        "Set-Cookie": await sessionStorage.commitSession(session),
      },
    },
  );
}
