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
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  const user = await getDb().user.findUnique({
    where: {
      id: session.get("userId"),
    },
  });

  if (!user) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  if (user.relayPrivateKey !== null) {
    return Response.json({ error: "Keys already generated" }, { status: 400 });
  }

  const { privateKey, publicKey } = crypto.generateKeyPairSync("ec", {
    namedCurve: "secp521r1",
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
    publicKeyEncoding: { type: "spki", format: "pem" },
  });

  const signKey = nacl.sign.keyPair();
  const encKey = nacl.box.keyPair();

  await getDb().user.update({
    where: { id: user.id },
    data: {
      relayPrivateKey: privateKey,
      relayPublicKey: publicKey,
      consumerAuthPublicKey: Buffer.from(signKey.publicKey).toString("hex"),
      consumerAuthKey: Buffer.from(signKey.secretKey).toString("hex"),
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
}
