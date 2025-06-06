import { userContext } from "~/middlewares/auth";
import { getSharedCredentials } from "~/providers/idos.server";
import type { Route } from "./+types/data";

export async function loader({ request, context }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const credentialsId = url.searchParams.get("credentialsId");
  const user = context.get(userContext);

  if (!credentialsId || !user) {
    return Response.json({ error: "credentialsId or user is required" }, { status: 400 });
  }

  try {
    const credentials = await getSharedCredentials(credentialsId, user.address);
    return Response.json(credentials);
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 400 });
  }
}
