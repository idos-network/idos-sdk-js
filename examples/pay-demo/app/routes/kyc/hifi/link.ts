import { createUserAndKYC } from "~/providers/hifi.server";
import { getCredentialShared } from "~/providers/idos.server";
import { sessionStorage } from "~/providers/sessions.server";
import type { Route } from "../+types/link";

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const credentialId = url.searchParams.get("credentialId");
  const signedAgreementId = url.searchParams.get("signedAgreementId");

  const session = await sessionStorage.getSession(request.headers.get("Cookie"));
  const user = session.get("user");

  if (!credentialId || !user || !signedAgreementId) {
    return Response.json(
      { error: "credentialId, user or signedAgreementId is required" },
      { status: 400 },
    );
  }

  // Check if the user accepted the right TOS
  if (session.get("hifiTosId") !== signedAgreementId) {
    return Response.json({ error: "User did not accept the right TOS" }, { status: 400 });
  }

  try {
    const data = await getCredentialShared(credentialId, user.address);
    const userId = await createUserAndKYC(signedAgreementId, credentialId, data, url);

    session.set("hifiUserId", userId);
    session.unset("hifiTosId");

    return Response.json(
      {
        userId,
      },
      {
        headers: {
          "Set-Cookie": await sessionStorage.commitSession(session),
        },
      },
    );
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 400 });
  }
}
