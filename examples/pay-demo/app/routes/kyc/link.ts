import type { LoaderFunctionArgs } from "react-router";

import { userContext } from "~/middlewares/auth.server";
import { generateRelayUrl } from "~/providers/relay.server";

export async function loader({ request, context }: LoaderFunctionArgs) {
  const currentUrl = new URL(request.url);
  const type = currentUrl.searchParams.get("type");
  const user = context.get(userContext);

  if (!user) {
    return Response.json({ error: "User is required" }, { status: 401 });
  }

  const url = await generateRelayUrl(type ?? "sumsub", user.address);

  return Response.json({ url });
}
