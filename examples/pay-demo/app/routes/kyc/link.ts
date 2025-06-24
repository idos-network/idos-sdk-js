import { generateKrakenUrl } from "~/providers/kraken.server";

export async function loader() {
  const url = await generateKrakenUrl();

  return Response.json({ url });
}
