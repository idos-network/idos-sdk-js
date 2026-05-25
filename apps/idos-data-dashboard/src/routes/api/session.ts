import { getDb } from "@/core/db.server";
import { sessionStorage } from "@/core/sessions.server";

import type { Route } from "./+types/session";

export async function loader({ request }: Route.LoaderArgs) {
  const session = await sessionStorage.getSession(request.headers.get("Cookie"));

  if (!session.get("userId")) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await getDb().user.findUnique({
    where: {
      id: session.get("userId"),
    },
    select: {
      acceptedTermsAndConditions: true,
      id: true,
      relayPrivateKey: true,
      relayClientId: true,
    },
  });

  if (!user) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  return Response.json(
    {
      userId: session.get("userId"),
      acceptedTermsAndConditions: user.acceptedTermsAndConditions,
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

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "DELETE") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  const session = await sessionStorage.getSession(request.headers.get("Cookie"));

  return Response.json(
    { sessionCleared: true },
    {
      headers: {
        "Set-Cookie": await sessionStorage.destroySession(session),
      },
    },
  );
}
