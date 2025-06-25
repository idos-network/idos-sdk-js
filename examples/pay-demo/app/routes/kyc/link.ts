import type { LoaderFunctionArgs } from "react-router";
import { generateKrakenUrl } from "~/providers/kraken.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const currentUrl = new URL(request.url);
  const type = currentUrl.searchParams.get("type");

  const url = await generateKrakenUrl(type ?? "sumsub");

  return Response.json({ url });
}
