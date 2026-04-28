import { getDb } from "@/core/db.server";
import { createRelayClient } from "@/core/relay.server";
import { sessionStorage } from "@/core/sessions.server";

import type { Route } from "./+types/journeys";

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

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

  if (user.relayClientId !== null) {
    return Response.json({ error: "Journeys already generated" }, { status: 400 });
  }

  const clientId = await createRelayClient({
    name: "Developer console preview",
    email: "developer@idos.network",
    publicKey: user.relayPublicKey ?? "",
    consumerWallet: user.walletAddress,
    consumerEncPubKey: user.publicEncryptionKey,
    blockedCountries: [],
  });

  await getDb().user.update({
    where: { id: user.id },
    data: { relayClientId: clientId },
  });

  return Response.json(
    {
      journeysGenerated: true,
    },
    {
      headers: {
        "Set-Cookie": await sessionStorage.commitSession(session),
      },
    },
  );
}
