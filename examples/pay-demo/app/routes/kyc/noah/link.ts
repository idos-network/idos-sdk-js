import { getCredentialShared } from "~/providers/idos.server";
import { createNoahCustomer } from "~/providers/noah.server";
import { sessionStorage } from "~/providers/sessions.server";
import type { Route } from "../+types/link";

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const credentialId = url.searchParams.get("credentialId");

  const session = await sessionStorage.getSession(request.headers.get("Cookie"));
  const user = session.get("user");

  if (!credentialId || !user) {
    return Response.json({ error: "credentialId or user is required" }, { status: 400 });
  }

  try {
    const data = await getCredentialShared(credentialId, user.address);

    const response = await createNoahCustomer(user.address, data, url);

    session.set("noahCheckoutSessionID", response.CheckoutSession.CheckoutSessionID);

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
