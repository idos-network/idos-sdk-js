import { statusAndIban } from "~/providers/monerium.server";
import { sessionStorage } from "~/providers/sessions.server";
import type { Route } from "./+types/status";

export async function loader({ request }: Route.LoaderArgs) {
  const session = await sessionStorage.getSession(request.headers.get("Cookie"));
  const user = session.get("user");
  const moneriumProfileId = session.get("moneriumProfileId");

  if (!moneriumProfileId || !user) {
    return Response.json({ error: "moneriumProfileId or user is required" }, { status: 400 });
  }

  try {
    const profileStatus = await statusAndIban(moneriumProfileId);

    return Response.json(profileStatus);
  } catch (error) {
    console.error(error);
    return Response.json({ error: (error as Error).message }, { status: 400 });
  }
}
