import type { Credentials } from "@idos-network/consumer";
import type { SessionUser } from "~/interfaces";
import { SERVER_ENV } from "./envFlags.server";
import { generateCodeChallenge } from "./utils";

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
