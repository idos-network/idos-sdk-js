import { userContext } from "~/middlewares/auth.server";
import { createOnboardingSession, prefillNoahUser } from "~/providers/noah.server";
import { fetchSharedToken } from "~/providers/relay.server";

import type { Route } from "../+types/link";

export async function loader({ request, context }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const credentialId = url.searchParams.get("credentialId");
  const relayDAG = url.searchParams.get("relayDAG");
  const user = context.get(userContext);

  if (!credentialId || !relayDAG) {
    return Response.json({ error: "credentialId and relayDAG are required" }, { status: 400 });
  }

  try {
    const tokenData = await fetchSharedToken(relayDAG, "noah.com_61413");

    await prefillNoahUser(user.address, tokenData.token);

    const response = await createOnboardingSession(user.address, url);

    return Response.json({
      url: response.HostedURL,
      currentUrl: url.toString(),
    });
  } catch (error) {
    console.error(error);
    return Response.json({ error: (error as Error).message }, { status: 400 });
  }
}
