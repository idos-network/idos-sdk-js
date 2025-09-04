import { getCredentialShared } from "~/providers/idos.server";
import { auth } from "~/providers/monerium.server";
import { sessionStorage } from "~/providers/sessions.server";
import type { Route } from "./+types/auth";

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

    const authResult = await auth(data, url);

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
