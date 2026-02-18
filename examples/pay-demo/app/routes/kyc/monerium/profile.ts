import { userContext } from "~/middlewares/auth.server";
import { getCredentialShared } from "~/providers/idos.server";
import { createProfile } from "~/providers/monerium.server";
import { sessionStorage } from "~/providers/sessions.server";
import type { Route } from "./+types/profile";

export async function loader({ request, context }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const credentialId = url.searchParams.get("credentialId");
  const session = await sessionStorage.getSession(request.headers.get("Cookie"));
  const user = context.get(userContext);
  const profileId = session.get("moneriumProfileId");

  if (!credentialId || !profileId) {
    return Response.json({ error: "credentialId or profileId is required" }, { status: 400 });
  }

  try {
    const data = await getCredentialShared(credentialId, user.address);

    await createProfile(profileId, data);

    return Response.json(
      { status: "success" },
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
