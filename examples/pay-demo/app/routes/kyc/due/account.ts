import { userContext } from "~/middlewares/auth.server";
import { type CreateAccountResponse, createAccount, getAccount } from "~/providers/due.server";
import { getCredentialShared } from "~/providers/idos.server";
import { setUserItem } from "~/providers/store.server";
import type { Route } from "./+types/account";

export async function action({ request, context }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  const user = context.get(userContext);

  if (!user.sharedKyc?.sharedId) {
    return Response.json({ error: "User item or shared credential not found" }, { status: 400 });
  }

  let accountResponse: CreateAccountResponse | null = null;

  try {
    if (user.due?.accountId) {
      accountResponse = await getAccount(user.due.accountId);

      if (!accountResponse) {
        throw new Error("Can't get due account, try again later.");
      }
    } else {
      const data = await getCredentialShared(user.sharedKyc.sharedId, user.address);

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

      user.due = {
        accountId: accountResponse.id,
        kycStatus: "new",
        tosAccepted: false,
      };
    }

    user.due.tosLinks = accountResponse.tos.documentLinks;
    user.due.tosToken = accountResponse.tos.token;
    user.due.tosAccepted = accountResponse.tos.status === "accepted";

    await setUserItem(user);

    return Response.json(user);
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 400 });
  }
}
