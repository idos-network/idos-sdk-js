import { redirect } from "react-router";
import { SiweMessage } from "siwe";
import { sessionStorage } from "~/providers/sessions.server";
import type { Route } from "./+types/auth";
import { getUserItem, setUserItem } from "~/providers/store.server";

// Create a new user session
export async function loader({ request }: Route.LoaderArgs) {
  const session = await sessionStorage.getSession(request.headers.get("Cookie"));

  const url = new URL(request.url);
  const address = url.searchParams.get("address");

  if (!address) {
    throw new Error("Address query parameter is required");
  }

  const uri = new URL(request.url);
  // Remove hash, query parameters, and search parameters
  uri.hash = "";
  uri.search = "";
  uri.pathname = "";

  const message = new SiweMessage({
    domain: url.hostname,
    address,
    statement: "Sign in with Ethereum to the app.",
    uri: uri.toString(),
    version: "1",
    chainId: 1,
  });

  const user = {
    address,
    message: message.prepareMessage(),
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

  const { signature, address } = await request.json();

  if (!signature || !address) {
    throw new Error("Signature and address are required");
  }

  if (address.toLowerCase() !== user.address.toLowerCase()) {
    throw new Error("Address mismatch");
  }

  try {
    const message = new SiweMessage(user.message);
    const isValid = await message.verify({ signature });

    if (!isValid) {
      throw new Error("Invalid signature");
    }

    const userItem = await getUserItem(user.address);

    // Set user item in persistent storage
    await setUserItem({
      id: crypto.randomUUID(),
      address: user.address,
      ...(userItem ?? {}), // Update user item with new message and signature, fine to overwrite ids etc.
      message: message.prepareMessage(),
      signature,
      lastSignedIn: new Date().toISOString(),
    });

    // Update session with authenticated status
    session.set("user", {
      ...user,
      isAuthenticated: true,
    });

    return redirect("/app", {
      headers: {
        "Set-Cookie": await sessionStorage.commitSession(session),
      },
    });
  } catch (_error) {
    console.error(_error);
    throw new Error("Signature verification failed");
  }
}
