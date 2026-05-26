import crypto from "node:crypto";
import nacl from "tweetnacl";

import { getDb } from "@/core/db.server";
import { sessionStorage } from "@/core/sessions.server";

import type { Route } from "./+types/keys";

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  const session = await sessionStorage.getSession(request.headers.get("Cookie"));

  if (!session.get("userId")) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { privateKey, publicKey } = crypto.generateKeyPairSync("ec", {
    namedCurve: "secp521r1",
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
    publicKeyEncoding: { type: "spki", format: "pem" },
  });

  const signKey = nacl.sign.keyPair();
  const encKey = nacl.box.keyPair();

  const db = await getDb();

  try {
    await db.user.update({
      where: { id: session.get("userId"), relayPrivateKey: null },
      data: {
        relayPrivateKey: privateKey,
        relayPublicKey: publicKey,
        // Signing keys use hex encoding; decoded via Buffer.from(..., "hex") before nacl.sign operations
        consumerAuthPublicKey: Buffer.from(signKey.publicKey).toString("hex"),
        consumerAuthKey: Buffer.from(signKey.secretKey).toString("hex"),
        // Encryption keys use base64 encoding; passed directly to idOSConsumerClass which expects this format
        consumerEncPublicKey: Buffer.from(encKey.publicKey).toString("base64"),
        consumerEncKey: Buffer.from(encKey.secretKey).toString("base64"),
      },
    });

    return Response.json(
      {
        keysGenerated: true,
      },
      {
        headers: {
          "Set-Cookie": await sessionStorage.commitSession(session),
        },
      },
    );
  } catch (error) {
    console.error("Failed to generate keys", error);

    return Response.json(
      { error: "Keys already generated or user does not exist" },
      { status: 400 },
    );
  }
}
