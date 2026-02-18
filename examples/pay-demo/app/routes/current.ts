import { authMiddleware, userContext } from "~/middlewares/auth.server";
import { setUserItem } from "~/providers/store.server";
import type { Route } from "./+types/current";

export const middleware = [authMiddleware];

export async function loader({ context }: Route.LoaderArgs) {
  const user = context.get(userContext);
  return Response.json(user);
}

export async function action({ request, context }: Route.ActionArgs) {
  const user = context.get(userContext);
  const body = await request.json();

  user.idOSUserId = body.userId;

  await setUserItem(user);

  return Response.json(user);
}
