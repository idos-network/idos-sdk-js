import crypto from "node:crypto";

import { getDb } from "@/core/db.server";
import { createRelayClient } from "@/core/relay.server";
import { sessionStorage } from "@/core/sessions.server";

import type { Route } from "./+types/journeys";

const integrationAdjectives = ["Aurora", "Nimbus", "Vertex", "Signal", "Orbit", "Nova"];
const integrationNouns = ["Relay", "Gateway", "Console", "Bridge", "Passport", "Launchpad"];

function createIntegrationName(user: { id: string; walletAddress: string }) {
  const hash = crypto.createHash("sha256").update(`${user.id}:${user.walletAddress}`).digest();
  const adjective = integrationAdjectives[hash[0] % integrationAdjectives.length];
  const noun = integrationNouns[hash[1] % integrationNouns.length];
  const suffix = user.walletAddress.replace(/^0x/, "").slice(0, 6).toUpperCase();
  return `${adjective} ${noun} ${suffix}`;
}

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

  if (
    user.relayClientId !== null ||
    user.consumerAuthPublicKey === null ||
    user.consumerAuthKey === null ||
    user.consumerEncKey === null ||
    user.consumerEncPublicKey === null
  ) {
    return Response.json({ error: "Journeys already generated" }, { status: 400 });
  }

  const name = createIntegrationName(user);

  const clientId = await createRelayClient({
    name,
    email: "developer@idos.network",
    publicKey: user.relayPublicKey ?? "",
    consumerWallet: user.consumerAuthPublicKey,
    consumerEncPubKey: user.consumerEncPublicKey,
    blockedCountries: [],
  });

  await getDb().user.update({
    where: { id: user.id },
    data: { relayClientId: clientId, relayName: name },
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
