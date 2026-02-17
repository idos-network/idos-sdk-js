import { getUsableCredentialByUser } from "~/providers/idos.server";
import { sessionStorage } from "~/providers/sessions.server";
import { getUserItem, setUserItem } from "~/providers/store.server";
import type { Route } from "./+types/shared";

// Get available shared credentials for the user (and issuer)
// eventually store them
export async function loader({ request }: Route.LoaderArgs) {
  const session = await sessionStorage.getSession(request.headers.get("Cookie"));

  if (!session.get("user")) {
    return Response.json({ error: "No session found" }, { status: 401 });
  }

  const userItem = await getUserItem(session.get("user")!.address);
  if (!userItem || !userItem.idOSUserId) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  if (userItem.sharedKyc?.id) {
    return Response.json(userItem);
  }

  // Get credentials shared by user
  const credential = await getUsableCredentialByUser(userItem.idOSUserId);

  if (!credential) {
    return Response.json({ error: "No credentials found" }, { status: 404 });
  }

  // If they matches
  if (!userItem.sharedKyc) {
    userItem.sharedKyc = {
      sharedId: credential.id,
      originalId: credential.original_id!,
    };
  } else {
    userItem.sharedKyc.sharedId = credential.id;
    userItem.sharedKyc.originalId = credential.original_id!;
  }

  await setUserItem(userItem);

  return Response.json(userItem);
}
