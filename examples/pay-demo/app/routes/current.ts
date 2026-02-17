import { sessionStorage } from "~/providers/sessions.server";
import type { Route } from "./+types/current";
import { getUserItem, setUserItem } from "~/providers/store.server";

// Get current user
export async function loader({ request }: Route.LoaderArgs) {
  const session = await sessionStorage.getSession(request.headers.get("Cookie"));

  if (!session.get("user")) {
    return Response.json({ error: "No session found" }, { status: 401 });
  }

  const userItem = await getUserItem(session.get("user")!.address);
  if (!userItem) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  return Response.json(userItem);
}


export async function action({ request }: Route.ActionArgs) {
  const session = await sessionStorage.getSession(request.headers.get("Cookie"));
  const user = session.get("user");

  if (!user) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  const userItem = await getUserItem(user.address);
  if (!userItem) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  const body = await request.json();

  console.log("body", body);

  userItem.idOSUserId = body.userId;
  await setUserItem(userItem);

  return Response.json(user);
}