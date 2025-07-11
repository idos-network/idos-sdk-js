import type { Route } from "../+types/auth";
import { auth } from "~/providers/monerium.server";
import { getSharedCredential } from "~/providers/idos.server";
import { sessionStorage } from "~/providers/sessions.server";

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const credentialId = url.searchParams.get("credentialId");

  const session = await sessionStorage.getSession(request.headers.get("Cookie"));
  const user = session.get("user");

  if (!credentialId || !user) {
    return Response.json({ error: "credentialId or user is required" }, { status: 400 });
  }

  try {
    const data = await getSharedCredential(credentialId, user.address);

    const authResult = await auth(data, user, url);

    session.set("moneriumCodeVerifier", authResult.codeVerifier);

    return Response.json(
      { url: authResult.url },
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
