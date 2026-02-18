import { userContext } from "~/middlewares/auth.server";
import { getCredentialShared } from "~/providers/idos.server";
import { createUser } from "~/providers/monerium.server";
import { sessionStorage } from "~/providers/sessions.server";
import type { Route } from "./+types/user";

export async function loader({ request, context }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const credentialId = url.searchParams.get("credentialId");
  const session = await sessionStorage.getSession(request.headers.get("Cookie"));
  const user = context.get(userContext);

  if (!credentialId) {
    return Response.json({ error: "credentialId is required" }, { status: 400 });
  }

  try {
    const data = await getCredentialShared(credentialId, user.address);

    const profileId = await createUser(data);

    session.set("moneriumProfileId", profileId);

    return Response.json(
      { url: profileId },
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
