import { fetchSharedToken } from "~/providers/kraken.server";
import { createOnboardingSession, prefillNoahUser } from "~/providers/noah.server";
import { sessionStorage } from "~/providers/sessions.server";
import type { Route } from "../+types/link";

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const credentialId = url.searchParams.get("credentialId");
  const krakenDAG = url.searchParams.get("krakenDAG");

  const session = await sessionStorage.getSession(request.headers.get("Cookie"));
  const user = session.get("user");

  if (!credentialId || !user || !krakenDAG) {
    return Response.json(
      { error: "credentialId, user and krakenDAG are required" },
      { status: 400 },
    );
  }

  try {
    // Generate kraken shared token
    const token = await fetchSharedToken(krakenDAG, "noah.com_61413");

    // WARNING: We are using address, since we have no user-management
    // Prefill noah user & create payin request
    await prefillNoahUser(user.address, token);

    const response = await createOnboardingSession(user.address, url);

    // const response = await createPayInRequest(user.address, url);
    // session.set("noahCheckoutSessionID", response.CheckoutSession.CheckoutSessionID);

    return Response.json(
      {
        url: response.HostedURL,
        currentUrl: url.toString(),
      },
      {
        headers: {
          "Set-Cookie": await sessionStorage.commitSession(session),
        },
      },
    );
  } catch (error) {
    console.error(error);
    return Response.json({ error: (error as Error).message }, { status: 400 });
  }
}
