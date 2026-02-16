import { userContext } from "~/middlewares/auth.server";
import { fetchSharedToken } from "~/providers/kraken.server";
import type { Route } from "./+types/token";

export async function loader({ request, context }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const credentialId = url.searchParams.get("credentialId");
  const provider = url.searchParams.get("provider");
  const user = context.get(userContext);

  if (!credentialId || !user || !provider) {
    return Response.json({ error: "credentialId, provider or user is required" }, { status: 400 });
  }

  try {
    // Call kraken to get the full token response (id, kycStatus, token, forClientId)
    const tokenData = await fetchSharedToken(credentialId, provider);

    return Response.json(tokenData);
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 400 });
  }
}
