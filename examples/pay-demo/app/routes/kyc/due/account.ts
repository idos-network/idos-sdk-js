import { createAccount, getAccount } from "~/providers/due.server";
import { getCredentialShared } from "~/providers/idos.server";
import { sessionStorage } from "~/providers/sessions.server";
import type { Route } from "./+types/account";

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const session = await sessionStorage.getSession(request.headers.get("Cookie"));
  const user = session.get("user");
  const credentialId = url.searchParams.get("credentialId");

  if (!user || !credentialId) {
    return Response.json({ error: "user and credentialId are required" }, { status: 400 });
  }

  if (session.get("dueAccountId")) {
    const account = await getAccount(session.get("dueAccountId") as string);

    if (account.status === "active") {
      return Response.json(account);
    }

    return Response.json(account);
  }

  try {
    const data = await getCredentialShared(credentialId, user.address);

    const response = await createAccount({
      type: "individual",
      category: "employed",
      name: `${data.credentialSubject.firstName} ${data.credentialSubject.familyName}`,
      email: data.credentialSubject.email as string,
      country: data.credentialSubject.nationality ?? data.credentialSubject.idDocumentCountry,
    });

    // Set Due account ID in session
    session.set("dueAccountId", response.id);

    return Response.json(response, {
      headers: {
        "Set-Cookie": await sessionStorage.commitSession(session),
      },
    });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 400 });
  }
}
