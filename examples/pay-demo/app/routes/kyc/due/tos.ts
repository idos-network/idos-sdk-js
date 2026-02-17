import { confirmTos } from "~/providers/due.server";
import { sessionStorage } from "~/providers/sessions.server";
import { getUserItem, setUserItem } from "~/providers/store.server";
import type { Route } from "./+types/tos";

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  const session = await sessionStorage.getSession(request.headers.get("Cookie"));
  const user = session.get("user");

  if (!user) {
    return Response.json({ error: "User is required" }, { status: 400 });
  }

  const userItem = await getUserItem(user.address);
  if (!userItem || !userItem.due?.accountId || !userItem.due.tosToken) {
    return Response.json({ error: "User or due account not found" }, { status: 400 });
  }

  try {
    if (!userItem.due.tosAccepted) {
      const ip =
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        request.headers.get("x-real-ip") ||
        "unknown";

      await confirmTos(userItem.due.tosToken, ip);
      userItem.due.tosAccepted = true;
      await setUserItem(userItem);
    }

    return Response.json(userItem);
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 400 });
  }
}
