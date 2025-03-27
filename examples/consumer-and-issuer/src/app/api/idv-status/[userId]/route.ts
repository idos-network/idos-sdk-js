import { base64Decode, base64Encode, utf8Encode } from "@idos-network/core";
import { toBytes } from "@idos-network/core";
import type { NextRequest } from "next/server";
import invariant from "tiny-invariant";
import nacl from "tweetnacl";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  const idvUserId = (await params).userId;

  const issuerSigningSecretKey = process.env.NEXT_ISSUER_SIGNING_SECRET_KEY;
  invariant(issuerSigningSecretKey, "`NEXT_ISSUER_SIGNING_SECRET_KEY` is not set");
  const issuerSigningKey = nacl.sign.keyPair.fromSecretKey(base64Decode(issuerSigningSecretKey));

  const searchParams = request.nextUrl.searchParams;
  const idOSUserId = searchParams.get("idOSUserId");
  invariant(idOSUserId, "idOSUserId is required");
  const signature = searchParams.get("signature");
  invariant(signature, "signature is required");

  //@todo: @pkoch fix me
  // invariant(
  //   nacl.sign.open(toBytes(`${idvUserId}${idOSUserId}`), issuerSigningKey.publicKey) ===
  //     base64Decode(signature),
  //   "Signature is invalid",
  // );

  const response = await fetch(
    `https://kraken.staging.sandbox.fractal.id/public/kyc/${idvUserId}/status`,
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.KRAKEN_API_KEY}`,
      },
    },
  );

  const json = await response.json();

  return new Response(JSON.stringify(json), {
    status: 200,
  });
}
