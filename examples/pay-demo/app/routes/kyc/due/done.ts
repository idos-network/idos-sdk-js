import { getAccount } from "~/providers/due.server";
import { sessionStorage } from "~/providers/sessions.server";
import type { Route } from "./+types/account";

export async function loader({ request }: Route.LoaderArgs) {
  const session = await sessionStorage.getSession(request.headers.get("Cookie"));
  const user = session.get("user");

  if (!user || !session.get("dueAccountId")) {
    return Response.json({ error: "user and credentialId are required" }, { status: 400 });
  }

  const account = await getAccount(session.get("dueAccountId") as string);

  if (account.kyc.status === "approved" || account.kyc.status === "passed") {
    return Response.json(account);
  }

  return Response.json({ status: "pending" }, { status: 400 });
}
