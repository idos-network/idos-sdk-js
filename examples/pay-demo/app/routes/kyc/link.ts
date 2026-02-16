import type { LoaderFunctionArgs } from "react-router";
import { userContext } from "~/middlewares/auth.server";
import { generateKrakenUrl } from "~/providers/kraken.server";

export async function loader({ request, context }: LoaderFunctionArgs) {
  const currentUrl = new URL(request.url);
  const type = currentUrl.searchParams.get("type");
  const user = context.get(userContext);

  const url = await generateKrakenUrl(type ?? "sumsub", user.address);

  return Response.json({ url });
}
