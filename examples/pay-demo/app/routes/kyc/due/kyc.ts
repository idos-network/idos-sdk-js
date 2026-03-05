import { userContext } from "~/middlewares/auth.server";
import { getKycStatus, shareToken } from "~/providers/due.server";
import { SERVER_ENV } from "~/providers/envFlags.server";
import { fetchSharedToken } from "~/providers/kraken.server";
import { setUserItem } from "~/providers/store.server";
import type { Route } from "./+types/kyc";

export async function action({ request, context }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  const user = context.get(userContext);

  if (!user.due?.accountId || !user.due.tosAccepted || user.due.kycStatus !== "new") {
    return Response.json(
      { error: "User or due account not found or did not meet conditions" },
      { status: 400 },
    );
  }

  const body = await request.json();
  if (!body.dagId) {
    return Response.json({ error: "DAG ID is required" }, { status: 400 });
  }

  // Get share token from idOS relay for due
  let token: string | null = null;

  try {
    const sharedToken = await fetchSharedToken(body.dagId, "due.network_53224");

    if (!sharedToken || !sharedToken.token) {
      throw new Error("Shared token can't be created.");
    }

    token = sharedToken.token;
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 400 });
  }

  // Share token with Due
  try {
    await shareToken(user.due.accountId, token);

    user.due.kycStatus = "created";
    await setUserItem(user);
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 400 });
  }

  // Fetch KYC status from Due
  try {
    const response = await getKycStatus(user.due.accountId);

    if (response.status === "resubmission_required") {
      user.due.kycStatus = "resubmission_required";
      user.due.kycLink = `${SERVER_ENV.DUE_HTTP_URL}${response.externalLink}`;
    } else {
      user.due.kycStatus = response.status;
    }

    await setUserItem(user);

    return Response.json(user);
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 400 });
  }
}
