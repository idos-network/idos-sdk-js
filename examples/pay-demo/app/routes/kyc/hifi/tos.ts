import { fetchTosLink } from "~/providers/hifi.server";
import { sessionStorage } from "~/providers/sessions.server";
import type { Route } from "./+types/tos";

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);

  const session = await sessionStorage.getSession(request.headers.get("Cookie"));
  const user = session.get("user");

  if (!user) {
    return Response.json({ error: "user is required" }, { status: 400 });
  }

  try {
    const link = await fetchTosLink(url);

    session.set("hifiTosId", link.idempotencyKey);

    return Response.json(
      { link: link.url },
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
