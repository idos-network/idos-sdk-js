import { getKycStatus, shareToken } from "~/providers/due.server";
import { SERVER_ENV } from "~/providers/envFlags.server";
import { fetchSharedToken } from "~/providers/kraken.server";
import { sessionStorage } from "~/providers/sessions.server";
import { getUserItem, setUserItem } from "~/providers/store.server";
import type { Route } from "./+types/kyc";

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  const session = await sessionStorage.getSession(request.headers.get("Cookie"));
  const user = session.get("user");

  if (!user) {
    return Response.json({ error: "User is required" }, { status: 400 });
  }

  const userItem = await getUserItem(user.address);
  if (
    !userItem ||
    !userItem.due?.accountId ||
    !userItem.due.tosAccepted ||
    userItem.due.kycStatus !== "new"
  ) {
    return Response.json(
      { error: "User or due account not found or did not meet conditions" },
      { status: 400 },
    );
  }

  const body = await request.json();
  if (!body.dagId) {
    return Response.json({ error: "DAG ID is required" }, { status: 400 });
  }

  console.log("body", body);

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
    await shareToken(userItem.due.accountId, token);

    userItem.due.kycStatus = "created";
    await setUserItem(userItem);
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 400 });
  }

  // Fetch KYC status from Due
  try {
    const response = await getKycStatus(userItem.due.accountId);

    if (response.status === "resubmission_required") {
      userItem.due.kycStatus = "resubmission_required";
      userItem.due.kycLink = `${SERVER_ENV.DUE_HTTP_URL}${response.externalLink}`;
    } else {
      userItem.due.kycStatus = response.status;
    }

    await setUserItem(userItem);

    return Response.json(userItem);
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 400 });
  }
}
