import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { corsHeaders, handleCorsPreflightRequest } from "@/lib/cors";
import { completeSession, deleteSession, getSession } from "@/lib/handoff-store";

export async function loader({ params, request }: LoaderFunctionArgs) {
  const preflight = handleCorsPreflightRequest(request);
  if (preflight) return preflight;

  const secret = new URL(request.url).searchParams.get("secret");
  const sessionId = params.sessionId ?? "";
  const session = await getSession(sessionId, secret);

  if (!session) {
    return Response.json({ error: "Not found" }, { status: 404, headers: corsHeaders(request) });
  }

  const response = Response.json(
    { status: session.status, attestationToken: session.attestationToken },
    { headers: corsHeaders(request) },
  );

  if (session.status === "completed") {
    await deleteSession(session.id);
  }

  return response;
}

export async function action({ params, request }: ActionFunctionArgs) {
  const preflight = handleCorsPreflightRequest(request);
  if (preflight) return preflight;

  const { attestationToken } = await request.json();

  if (!attestationToken) {
    return Response.json(
      { error: "Missing attestationToken" },
      { status: 400, headers: corsHeaders(request) },
    );
  }

  const sessionId = params.sessionId ?? "";
  const success = await completeSession(sessionId, attestationToken);

  if (!success) {
    return Response.json(
      { error: "Session not found" },
      { status: 404, headers: corsHeaders(request) },
    );
  }

  return Response.json({ ok: true }, { headers: corsHeaders(request) });
}
