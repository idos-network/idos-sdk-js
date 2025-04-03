import { getKrakenToken } from "@/actions/index";
//import { base64Decode } from "@idos-network/core";
import type { NextRequest } from "next/server";
//import invariant from "tiny-invariant";
//import nacl from "tweetnacl";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  const idvUserId = (await params).userId;

  const searchParams = request.nextUrl.searchParams;
  const idOSUserId = searchParams.get("idOSUserId");
  if (!idOSUserId) return new Response("Missing idOSUserId on search params.", { status: 400 });
  const signature = searchParams.get("signature");
  if (!signature) return new Response("Missing signature on search params.", { status: 400 });

  //@todo: This should ensure that the signature we create on `getUserIdFromToken`.
  // const issuerSigningSecretKey = process.env.ISSUER_SIGNING_SECRET_KEY;
  // invariant(issuerSigningSecretKey, "`ISSUER_SIGNING_SECRET_KEY` is not set");
  // const issuerSigningKey = nacl.sign.keyPair.fromSecretKey(base64Decode(issuerSigningSecretKey));
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
        Authorization: `Bearer ${await getKrakenToken()}`,
      },
    },
  );

  const json = await response.json();

  return new Response(JSON.stringify(json), {
    status: 200,
  });
}
