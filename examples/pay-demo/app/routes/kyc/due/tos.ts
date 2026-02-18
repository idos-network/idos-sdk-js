import { userContext } from "~/middlewares/auth.server";
import { confirmTos } from "~/providers/due.server";
import { setUserItem } from "~/providers/store.server";
import type { Route } from "./+types/tos";

export async function action({ request, context }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  const user = context.get(userContext);

  if (!user.due?.accountId || !user.due.tosToken) {
    return Response.json({ error: "User or due account not found" }, { status: 400 });
  }

  try {
    if (!user.due.tosAccepted) {
      const ip =
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        request.headers.get("x-real-ip") ||
        "unknown";

      await confirmTos(user.due.tosToken, ip);
      user.due.tosAccepted = true;
      await setUserItem(user);
    }

    return Response.json(user);
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 400 });
  }
}
