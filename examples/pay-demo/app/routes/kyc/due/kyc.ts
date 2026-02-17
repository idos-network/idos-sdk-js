import { confirmTos, getKycStatus, shareToken } from "~/providers/due.server";
import { SERVER_ENV } from "~/providers/envFlags.server";
import { sessionStorage } from "~/providers/sessions.server";
import type { Route } from "./+types/kyc";
import { getUserItem, setUserItem } from "~/providers/store.server";

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
  if (!userItem || !userItem.due?.accountId || !userItem.due.tosAccepted || userItem.due.kycStatus !== "new") {
    return Response.json({ error: "User or due account not found or did not meet conditions" }, { status: 400 });
  }

  const body = await request.json();
  if (!body.dagId) {
    return Response.json({ error: "DAG ID is required" }, { status: 400 });
  }

  if (userItem.due.kycStatus === "new") {
    try {
      await shareToken(userItem.due.accountId, sharedToken);

      userItem.due.kycStatus = "created";
      await setUserItem(userItem);
    } catch (error) {
      return Response.json({ error: (error as Error).message }, { status: 400 });
    }
  }

  // Check KYC status and get link
  if (userItem.due.kycStatus === "created") {
    try {
      const response = await getKycStatus(userItem.due.accountId);

      if (response.status === "resubmission_required") {
        userItem.due.kycStatus = "resubmission_required";
        userItem.due.kycLink = `${SERVER_ENV.DUE_HTTP_URL}${response.externalLink}`;
      } else { 
        userItem.due.kycStatus = response.status;
      }
      
      await setUserItem(userItem);
    } catch (error) {
      return Response.json({ error: (error as Error).message }, { status: 400 });
    }
  }

  return Response.json(userItem);
}
