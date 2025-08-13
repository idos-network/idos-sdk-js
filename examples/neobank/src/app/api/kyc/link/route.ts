"server-only";

import jwt from "jsonwebtoken";
import type { NextRequest } from "next/server";
import invariant from "tiny-invariant";

const krakenApiUrl = process.env.KRAKEN_API_URL;
const krakenClientId = process.env.KRAKEN_CLIENT_ID;
const krakenLevel = process.env.KRAKEN_LEVEL;
const krakenPrivateKey = process.env.KRAKEN_PRIVATE_KEY;

type KYCType = "sumsub" | "persona";

async function generateKrakenUrl(type: KYCType = "sumsub"): Promise<string> {
  invariant(krakenApiUrl, "`KRAKEN_API_URL` is not set");
  invariant(krakenClientId, "`KRAKEN_CLIENT_ID` is not set");
  invariant(krakenLevel, "`KRAKEN_LEVEL` is not set");
  invariant(krakenPrivateKey, "`KRAKEN_PRIVATE_KEY` is not set");

  const payload = {
    clientId: krakenClientId,
    kyc: true,
    level: krakenLevel,
    state: Date.now().toString(),
  };
  console.log({ krakenPrivateKey });
  const token = jwt.sign(payload, krakenPrivateKey, { algorithm: "ES512" });
  console.log({ token });
  return `${krakenApiUrl}/kyc?token=${token}&provider=${type}`;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") as KYCType;
  const url = await generateKrakenUrl(type);

  return Response.json({ url });
}
