import https from "node:https";
import jwt from "jsonwebtoken";
import type { NextRequest } from "next/server";
import invariant from "tiny-invariant";

export async function GET(request: NextRequest) {
  const credentialId = request.nextUrl.searchParams.get("credentialId");

  const response = await fetch(
    `${process.env.KRAKEN_API_URL}/public/kyc/dag/${credentialId}/sharedToken?forClientId=transak`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${await getKrakenToken()}`,
      },
      // @ts-ignore - Node.js specific option
      agent: new https.Agent({
        rejectUnauthorized: false,
        checkServerIdentity: () => undefined, // This will bypass the certificate chain verification
      }),
    },
  ).then((res) => res.json());

  return Response.json({ token: response.token });
}

async function getKrakenToken(): Promise<string> {
  const payload = {
    api: true,
    clientId: process.env.KRAKEN_CLIENT_ID,
  };
  invariant(process.env.KRAKEN_PRIVATE_KEY, "KRAKEN_PRIVATE_KEY is not set");

  return jwt.sign(payload, process.env.KRAKEN_PRIVATE_KEY, {
    algorithm: "ES512",
    expiresIn: "600s",
  });
}
