import { createOnRampAccount } from "~/providers/hifi.server";
import { sessionStorage } from "~/providers/sessions.server";
import type { Route } from "./+types/account";

export async function loader({ request }: Route.LoaderArgs) {
  const session = await sessionStorage.getSession(request.headers.get("Cookie"));
  const user = session.get("user");
  const hifiUserId = session.get("hifiUserId");

  if (!user) {
    return Response.json({ error: "user is required" }, { status: 400 });
  }

  if (!hifiUserId) {
    return Response.json({ error: "user.hifiUserId is required" }, { status: 400 });
  }

  try {
    const response = await createOnRampAccount(hifiUserId, {
      sourceCurrency: "usd",
      destinationCurrency: "usdc",
      destinationChain: "POLYGON",
    });

    return Response.json({ response });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 400 });
  }
}
