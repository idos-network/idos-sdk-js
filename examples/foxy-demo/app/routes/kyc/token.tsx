import { userContext } from "~/middlewares/auth";
import { getSharedCredentials } from "~/providers/idos.server";
import { fetchSharedToken } from "~/providers/kraken.server";
import type { Route } from "./+types/token";

export async function loader({ request, context }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const credentialsId = url.searchParams.get("credentialsId");
  const user = context.get(userContext);

  if (!credentialsId || !user) {
    return Response.json({ error: "credentialsId or user is required" }, { status: 400 });
  }

  try {
    const credentials = await getSharedCredentials(credentialsId, user.address);

    if (!credentials.credentialSubject.applicantId) {
      throw new Error("Credentials are from previous version and can't be used.");
    }

    // Call kraken to get the token
    const token = await fetchSharedToken(credentials.credentialSubject.applicantId);

    return Response.json({ token });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 400 });
  }
}
