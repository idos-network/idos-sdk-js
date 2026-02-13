import { confirmTos, getLink, shareToken } from "~/providers/due.server";
import { SERVER_ENV } from "~/providers/envFlags.server";
import { sessionStorage } from "~/providers/sessions.server";
import type { Route } from "./+types/account";

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const session = await sessionStorage.getSession(request.headers.get("Cookie"));
  const user = session.get("user");
  const token = url.searchParams.get("tosToken");
  const sharedToken = url.searchParams.get("sumSubToken");

  if (!user || !token || !sharedToken) {
    return Response.json({ error: "user and token are required" }, { status: 400 });
  }

  if (!session.get("dueAccountId")) {
    return Response.json({ error: "Due account ID not found" }, { status: 400 });
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  try {
    await confirmTos(token, ip);

    const response = await shareToken(session.get("dueAccountId") as string, sharedToken);

    let link: string | null = null;

    if (response.status === "resubmission_pending") {
      const linkResponse = await getLink(session.get("dueAccountId") as string);
      link = `${SERVER_ENV.DUE_HTTP_URL}${linkResponse.externalLink}`;
    }

    return Response.json({ status: response.status, link });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 400 });
  }
}
