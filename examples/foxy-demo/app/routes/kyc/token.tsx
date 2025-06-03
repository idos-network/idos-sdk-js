import { fetchSharedToken } from "~/providers/kraken.server";
import type { Route } from "./+types/token";

// TODO: THIS IS SUPER DANGEROUS, WE DON'T CHECK IF THE CREDENTIAL IS VALID OR NOT
export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const idosCredentialsId = url.searchParams.get("idosCredentialsId");

  if (!idosCredentialsId) {
    return Response.json({ error: "idosCredentialsId is required" }, { status: 400 });
  }

  // Call kraken to get the token
  const token = await fetchSharedToken(idosCredentialsId);

  return Response.json({ token });
}
