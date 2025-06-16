import { generateSignInMessage, verifySignInMessage } from "@idos-network/wallets/utils";
import { redirect } from "react-router";
import { sessionStorage } from "~/providers/sessions.server";
import type { Route } from "./+types/auth";

// Create a new user session
export async function loader({ request }: Route.LoaderArgs) {
  const session = await sessionStorage.getSession(request.headers.get("Cookie"));

  const url = new URL(request.url);
  const address = url.searchParams.get("address");
  const chain = url.searchParams.get("chain");
  const publicKey = url.searchParams.get("publicKey");

  if (!address || !chain || !publicKey) {
    throw new Error("Address, chain and public key query parameters are required");
  }

  const uri = new URL(request.url);
  // Remove hash, query parameters, and search parameters
  uri.hash = "";
  uri.search = "";
  uri.pathname = "";

  const message = generateSignInMessage(address, chain, uri);

  const user = {
    address,
    chain,
    message,
    publicKey,
    isAuthenticated: false,
  };

  session.set("user", user);

  return new Response(JSON.stringify({ user }), {
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": await sessionStorage.commitSession(session),
    },
  });
}

// Validate signature and authenticate user
export async function action({ request }: Route.ActionArgs) {
  const session = await sessionStorage.getSession(request.headers.get("Cookie"));
  const user = session.get("user");

  if (request.method === "DELETE") {
    session.unset("user");
    return redirect("/", {
      headers: {
        "Set-Cookie": await sessionStorage.commitSession(session),
      },
    });
  }

  if (!user) {
    throw new Error("No session found");
  }

  const { signature, address, publicKey } = await request.json();

  if (!signature) {
    throw new Error("Signature is required");
  }

  // Near sends the address and public key in the request body
  if (user.chain === "near") {
    user.address = address;
    user.publicKey = publicKey;
  }

  try {
    const isValid = await verifySignInMessage(
      user.chain,
      user.address,
      user.publicKey,
      user.message,
      signature,
    );

    if (!isValid) {
      throw new Error("Invalid signature");
    }

    // Update session with authenticated status
    session.set("user", {
      ...user,
      signature,
      isAuthenticated: true,
    });

    return redirect("/app", {
      headers: {
        "Set-Cookie": await sessionStorage.commitSession(session),
      },
    });
  } catch (error) {
    console.error(error);
    throw new Error("Signature verification failed");
  }
}
