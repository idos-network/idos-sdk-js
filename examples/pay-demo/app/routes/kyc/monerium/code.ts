import { getTokenFromCode } from "~/providers/monerium.server";
import { sessionStorage } from "~/providers/sessions.server";
import type { Route } from "./+types/code";

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  const session = await sessionStorage.getSession(request.headers.get("Cookie"));
  const user = session.get("user");
  const codeVerifier = session.get("moneriumCodeVerifier");

  if (!code || !user || !codeVerifier) {
    return Response.json({ error: "code or user or codeVerifier is required" }, { status: 400 });
  }

  try {
    const { token, profileId } = await getTokenFromCode(code, codeVerifier, url);

    session.set("moneriumCodeVerifier", undefined);
    session.set("moneriumToken", token);
    session.set("moneriumProfileId", profileId);

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
