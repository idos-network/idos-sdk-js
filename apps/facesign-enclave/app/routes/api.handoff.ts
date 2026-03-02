import type { ActionFunctionArgs } from "react-router";
import { corsHeaders, handleCorsPreflightRequest } from "@/lib/cors";
import { createSession } from "@/lib/handoff-store";

export async function loader({ request }: ActionFunctionArgs) {
  return handleCorsPreflightRequest(request) ?? new Response("Method not allowed", { status: 405 });
}

export async function action({ request }: ActionFunctionArgs) {
  const preflight = handleCorsPreflightRequest(request);
  if (preflight) return preflight;

  const session = await createSession();
  return Response.json(
    { sessionId: session.id, secret: session.secret },
    { headers: corsHeaders(request) },
  );
}
