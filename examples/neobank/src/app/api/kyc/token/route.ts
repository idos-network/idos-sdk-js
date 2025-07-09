"server-only";

import { Agent } from "node:https";
import { goTry } from "go-try";
import jwt from "jsonwebtoken";
import type { NextRequest } from "next/server";
import invariant from "tiny-invariant";

const krakenApiUrl = process.env.KRAKEN_API_URL;
const krakenClientId = process.env.KRAKEN_CLIENT_ID;
const krakenLevel = process.env.KRAKEN_LEVEL;
const krakenPrivateKey = process.env.KRAKEN_PRIVATE_KEY;

async function getKrakenToken(): Promise<string> {
  invariant(krakenApiUrl, "`KRAKEN_API_URL` is not set");
  invariant(krakenClientId, "`KRAKEN_CLIENT_ID` is not set");
  invariant(krakenLevel, "`KRAKEN_LEVEL` is not set");
  invariant(krakenPrivateKey, "`KRAKEN_PRIVATE_KEY` is not set");

  const payload = {
    api: true,
    clientId: krakenClientId,
  };

  return jwt.sign(payload, krakenPrivateKey, {
    algorithm: "ES512",
    expiresIn: "600s",
  });
}
async function fetchKrakenSharedToken(credentialId: string): Promise<string> {
  const response = await fetch(
    `${krakenApiUrl}/public/kyc/dag/${credentialId}/sharedToken?forClientId=transak`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${await getKrakenToken()}`,
      },
      // @ts-expect-error - Node.js specific option
      agent: new Agent({
        rejectUnauthorized: false,
        checkServerIdentity: () => undefined, // Bypasses the certificate chain verification
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch shared token (${response.statusText}).`);
  }

  const data = await response.json();
  return data.token;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const credentialId = searchParams.get("credentialId");

  if (!credentialId) {
    return Response.json({ error: "`credentialId` search param is required" }, { status: 400 });
  }

  const [error, token] = await goTry(() => fetchKrakenSharedToken(credentialId));

  if (error) {
    return Response.json({ error }, { status: 400 });
  }

  return Response.json({ token });
}
