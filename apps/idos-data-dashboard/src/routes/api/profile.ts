import crypto from "node:crypto";
import { idOSIssuer } from "@idos-network/issuer";
import { hexDecode } from "@idos-network/utils/codecs";
import nacl from "tweetnacl";
import { z } from "zod";
import { COMMON_ENV } from "@/core/envFlags.common";
import { SERVER_ENV } from "@/core/envFlags.server";
import { sessionStorage } from "@/core/sessions.server";
import type { Route } from "./+types/profile";

export async function loader({ request }: Route.LoaderArgs) {
  const session = await sessionStorage.getSession(request.headers.get("Cookie"));

  // Generate a message to sign to validate ownership of the wallet address
  const userId = crypto.randomUUID();
  const proofMessage = `Please sign this message to confirm you own this wallet address. Nonce ${crypto.randomUUID()}`;
  session.set("proofMessage", proofMessage);
  session.set("userId", userId);

  return Response.json(
    {
      proofMessage,
      userId,
    },
    {
      headers: {
        "Set-Cookie": await sessionStorage.commitSession(session),
      },
    },
  );
}

const ProfileSchema = z.object({
  recipientEncryptionPublicKey: z.string(),
  encryptionPasswordStore: z.enum(["user", "mpc"]),
  walletAddress: z.string(),
  walletPublicKey: z.string(),
  signature: z.string(),
});

export type ProfileData = z.infer<typeof ProfileSchema>;

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  const body = await request.json();
  let profileData: ProfileData;

  try {
    profileData = ProfileSchema.parse(body);
  } catch (_error) {
    console.error("Invalid profile data", _error);
    return Response.json({ error: "Invalid profile data" }, { status: 400 });
  }

  const session = await sessionStorage.getSession(request.headers.get("Cookie"));

  if (!session.get("userId") || !session.get("proofMessage")) {
    return Response.json({ error: "User ID or proof message not found" }, { status: 400 });
  }

  const issuer = await idOSIssuer.init({
    nodeUrl: COMMON_ENV.IDOS_NODE_URL,
    signingKeyPair: nacl.sign.keyPair.fromSecretKey(hexDecode(SERVER_ENV.IDOS_ISSUER_SECRET_KEY)),
    encryptionSecretKey: hexDecode(SERVER_ENV.IDOS_ISSUER_ENCRYPTION_SECRET_KEY),
  });

  const {
    recipientEncryptionPublicKey,
    encryptionPasswordStore,
    walletAddress,
    walletPublicKey,
    signature,
  } = profileData;

  const createProfileResponse = await issuer.createUser(
    {
      id: session.get("userId"),
      recipient_encryption_public_key: recipientEncryptionPublicKey,
      encryption_password_store: encryptionPasswordStore,
    },
    {
      address: walletAddress,
      public_key: walletPublicKey,
      wallet_type: "FaceSign",
      signature: signature,
      message: session.get("proofMessage") as string,
    },
  );

  console.log("createProfileResponse");
  console.log(createProfileResponse);

  session.unset("proofMessage");
  session.unset("userId");

  return Response.json(
    { profileCreated: true },
    {
      headers: {
        "Set-Cookie": await sessionStorage.commitSession(session),
      },
    },
  );
}
