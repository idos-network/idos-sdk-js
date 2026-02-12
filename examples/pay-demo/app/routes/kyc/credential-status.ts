import { userContext } from "~/middlewares/auth";
import { fetchCredentialStatus } from "~/providers/kraken.server";
import type { Route } from "./+types/credential-status";

export async function loader({ request, context }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const credentialId = url.searchParams.get("credentialId");
  const user = context.get(userContext);

  if (!credentialId || !user) {
    return Response.json({ error: "credentialId or user is required" }, { status: 400 });
  }

  try {
    const status = await fetchCredentialStatus(credentialId);
    return Response.json(status);
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 400 });
  }
}
