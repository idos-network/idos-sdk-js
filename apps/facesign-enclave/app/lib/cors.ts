const ALLOWED_ORIGINS = (import.meta.env.VITE_ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((o: string) => o.trim());

export function corsHeaders(request: Request): HeadersInit {
  const origin = request.headers.get("Origin") ?? "";
  const isAllowed = ALLOWED_ORIGINS.includes("*") || ALLOWED_ORIGINS.includes(origin);

  return {
    "Access-Control-Allow-Origin": isAllowed ? origin : "",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export function handleCorsPreflightRequest(request: Request): Response | null {
  if (request.method !== "OPTIONS") return null;
  return new Response(null, { status: 204, headers: corsHeaders(request) });
}
