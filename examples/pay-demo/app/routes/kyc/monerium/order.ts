import { createOrder } from "~/providers/monerium.server";
import { sessionStorage } from "~/providers/sessions.server";
import type { Route } from "../+types/code";

export async function loader({ request }: Route.LoaderArgs) {
  const session = await sessionStorage.getSession(request.headers.get("Cookie"));
  const user = session.get("user");
  const moneriumProfileId = session.get("moneriumProfileId");

  if (!moneriumProfileId || !user) {
    return Response.json({ error: "moneriumProfileId or user is required" }, { status: 400 });
  }

  try {
    const order = await createOrder(moneriumProfileId, user.address, 100);

    return Response.json(
      { order },
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
