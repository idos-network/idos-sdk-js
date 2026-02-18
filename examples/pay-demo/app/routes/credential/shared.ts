import { authMiddleware, userContext } from "~/middlewares/auth.server";
import { getUsableCredentialByUser } from "~/providers/idos.server";
import { setUserItem } from "~/providers/store.server";
import type { Route } from "./+types/shared";

export const middleware = [authMiddleware];

export async function loader({ context }: Route.LoaderArgs) {
  const user = context.get(userContext);

  if (!user.idOSUserId) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  if (user.sharedKyc?.sharedId) {
    return Response.json(user);
  }

  const credential = await getUsableCredentialByUser(user.idOSUserId);

  if (!credential) {
    return Response.json({ error: "No credentials found" }, { status: 404 });
  }

  if (!user.sharedKyc) {
    user.sharedKyc = {
      sharedId: credential.id,
      originalId: credential.original_id!,
    };
  } else {
    user.sharedKyc.sharedId = credential.id;
    user.sharedKyc.originalId = credential.original_id!;
  }

  await setUserItem(user);

  return Response.json(user);
}
