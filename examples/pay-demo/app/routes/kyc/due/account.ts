import { type CreateAccountResponse, createAccount, getAccount } from "~/providers/due.server";
import { getCredentialShared } from "~/providers/idos.server";
import { sessionStorage } from "~/providers/sessions.server";
import { getUserItem, setUserItem } from "~/providers/store.server";
import type { Route } from "./+types/account";

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
  if (!userItem || !userItem.sharedKyc?.sharedId) {
    return Response.json({ error: "User item or shared credential not found" }, { status: 400 });
  }

  let accountResponse: CreateAccountResponse | null = null;

  try {
    if (userItem?.due?.accountId) {
      accountResponse = await getAccount(userItem.due.accountId);

      if (!accountResponse) {
        throw new Error("Can't get due account, try again later.");
      }
    } else {
      const data = await getCredentialShared(userItem.sharedKyc.sharedId, user.address);

      accountResponse = await createAccount({
        type: "individual",
        category: "employed",
        name: `${data.credentialSubject.firstName} ${data.credentialSubject.familyName}`,
        email: data.credentialSubject.email as string,
        country: data.credentialSubject.nationality ?? data.credentialSubject.idDocumentCountry,
      });

      if (!accountResponse) {
        throw new Error("Can't create due account, try again later.");
      }

      userItem.due = {
        accountId: accountResponse.id,
        kycStatus: "new",
        tosAccepted: false,
      };
    }

    userItem.due.tosLinks = accountResponse.tos.documentLinks;
    userItem.due.tosToken = accountResponse.tos.token;
    userItem.due.tosAccepted = accountResponse.tos.status === "accepted";

    // Set Due account ID in session
    await setUserItem(userItem);

    return Response.json(userItem);
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 400 });
  }
}
