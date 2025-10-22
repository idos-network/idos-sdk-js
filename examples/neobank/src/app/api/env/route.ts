import type { NextRequest } from "next/server";

export async function GET(_request: NextRequest) {
  const env = {
    KRAKEN_API_URL: process.env.KRAKEN_API_URL,
    KRAKEN_CLIENT_ID: process.env.KRAKEN_CLIENT_ID,
    KRAKEN_PRIVATE_KEY: process.env.KRAKEN_PRIVATE_KEY,
    KRAKEN_PUBLIC_KEY_MULTIBASE: process.env.KRAKEN_PUBLIC_KEY_MULTIBASE,
    KRAKEN_ISSUER: process.env.KRAKEN_ISSUER,
  };
  return Response.json(env);
}
