import { completeSession } from "@/lib/handoff-store";

import type { Route } from "./+types/api.handoff.$sessionId";

export async function action({ params, request }: Route.ActionArgs) {
  const { attestationToken } = await request.json();

  if (!attestationToken) {
    return Response.json({ error: "Missing attestationToken" });
  }

  const sessionId = params.sessionId;
  const success = await completeSession(sessionId, attestationToken);

  if (!success) {
    return Response.json({ error: "Session not found" });
  }

  return Response.json({ ok: true });
}
