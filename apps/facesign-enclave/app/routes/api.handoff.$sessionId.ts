import { completeSession, consumeAttestationToken } from "@/lib/handoff-store";
import { sessionStorage } from "@/lib/sessions.server";

import type { Route } from "./+types/api.handoff.$sessionId";

export async function action({ params, request }: Route.ActionArgs) {
  const sessionId = params.sessionId;

  // The desktop confirms it received the token; only the cookie holder of this session may redeem it.
  if (request.method === "DELETE") {
    const sessionData = await sessionStorage.getSession(request.headers.get("Cookie"));
    if (sessionData.get("sessionId") !== sessionId) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    await consumeAttestationToken(sessionId);
    return Response.json({ ok: true });
  }

  const { attestationToken } = await request.json();

  if (!attestationToken) {
    return Response.json({ error: "Missing attestationToken" });
  }

  const success = await completeSession(sessionId, attestationToken);

  if (!success) {
    return Response.json({ error: "Session not found or already completed" }, { status: 409 });
  }

  return Response.json({ ok: true });
}
