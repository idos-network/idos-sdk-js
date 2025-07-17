import type { Credentials } from "@idos-network/consumer";
import type { SessionUser } from "~/interfaces";
import { SERVER_ENV } from "./envFlags.server";
import { generateCodeChallenge } from "./utils";

export const getClientToken = async () => {
  const params = new URLSearchParams();
  params.set("grant_type", "client_credentials");
  params.set("client_id", SERVER_ENV.MONERIUM_CLIENT_ID);
  params.set("client_secret", SERVER_ENV.MONERIUM_CLIENT_SECRET);

  const response = await fetch(`${SERVER_ENV.MONERIUM_API_URL}/auth/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  if (!response.ok) {
    console.error(response);
    throw new Error("Failed to get client token");
  }

  return await response.json().then((data) => data.access_token);
};

export const createUser = async (data: Credentials, user: SessionUser, url: URL) => {
  if (!data.credentialSubject.email) {
    // Email is required, so you have to go to the auth page
    throw new Error("Email is required");
  }

  const clientToken = await getClientToken();

  console.log("Client token: ", clientToken);

  const response = await fetch(`${SERVER_ENV.MONERIUM_API_URL}/auth/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/vnd.monerium.api-v2+json",
      Authorization: `Bearer ${clientToken}`,
    },
    body: JSON.stringify({
      email: "jan+16july01@idos.network", // data.credentialSubject.email,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to create user, user already exists. Continue to auth page.");
  }

  const userData = await response.json();

  return userData.profile;
};

export const auth = async (data: Credentials, user: SessionUser, url: URL) => {
  // Generate PKCE code verifier and challenge
  const { codeChallenge, codeVerifier } = await generateCodeChallenge();

  // Cleanup URL
  const returnUrl = new URL(url.toString());
  returnUrl.pathname = "/callbacks/monerium/auth";
  returnUrl.search = "";
  returnUrl.hash = "";

  const params = new URLSearchParams();
  params.set("client_id", SERVER_ENV.MONERIUM_AUTH_CODE_FLOW);
  params.set("code_challenge", codeChallenge);
  params.set("code_challenge_method", "S256");
  params.set("address", user.address);
  params.set("email", data.credentialSubject.email);
  params.set("redirect_uri", returnUrl.toString());

  const authUrl = new URL(`${SERVER_ENV.MONERIUM_API_URL}/auth?${params.toString()}`);

  return {
    url: authUrl.toString(),
    codeVerifier, // Store this securely for the token exchange
  };
};
