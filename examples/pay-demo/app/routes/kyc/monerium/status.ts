import type { Route } from "../+types/status";
import { sessionStorage } from "~/providers/sessions.server";
import { status } from "~/providers/monerium.server";

export async function loader({ request }: Route.LoaderArgs) {
  const session = await sessionStorage.getSession(request.headers.get("Cookie"));
  const user = session.get("user");
  const moneriumProfileId = session.get("moneriumProfileId");

  if (!moneriumProfileId || !user) {
    return Response.json({ error: "moneriumProfileId or user is required" }, { status: 400 });
  }

  try {
    const profileStatus = await status(moneriumProfileId);

    return Response.json(
      { status: profileStatus },
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
