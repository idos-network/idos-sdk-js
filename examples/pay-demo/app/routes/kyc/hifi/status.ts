import { getKycStatus } from "~/providers/hifi.server";
import { sessionStorage } from "~/providers/sessions.server";
import type { Route } from "./+types/status";

export async function loader({ request }: Route.LoaderArgs) {
  const session = await sessionStorage.getSession(request.headers.get("Cookie"));
  const hifiUserId = session.get("hifiUserId");

  if (!hifiUserId) {
    return Response.json({ error: "hifiUserId is required" }, { status: 400 });
  }

  try {
    const response = await getKycStatus(hifiUserId);
    return Response.json({
      status: response.status,
      message: response.message,
    });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 400 });
  }
}
