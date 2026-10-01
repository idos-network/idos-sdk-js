import { idOSIssuer } from "@idos-network/issuer";
import { hexDecode } from "@idos-network/utils/codecs";
import * as Sentry from "@sentry/react-router";
import crypto from "node:crypto";
import nacl from "tweetnacl";
import { z } from "zod";

import { COMMON_ENV } from "@/core/envFlags.common";
import { SERVER_ENV } from "@/core/envFlags.server";
import { sessionStorage } from "@/core/sessions.server";
import { WalletType } from "@/generated/prisma/enums";

import type { Route } from "./+types/profile";

export async function loader({ request }: Route.LoaderArgs) {
  const session = await sessionStorage.getSession(request.headers.get("Cookie"));
  const url = new URL(request.url);
  const address = url.searchParams.get("address");
  const walletType = z.enum(WalletType).safeParse(url.searchParams.get("walletType"));

  if (!address || !walletType.success) {
    return Response.json({ error: "Wallet address and type are required" }, { status: 400 });
  }

  const userId = crypto.randomUUID();
  const notBefore = new Date();
  const notAfter = new Date(notBefore.getTime() + 15 * 60 * 1000);
  const walletNotBefore = notBefore.toISOString();
  const walletNotAfter = notAfter.toISOString();

  const issuer = await idOSIssuer.init({
    nodeUrl: COMMON_ENV.IDOS_NODE_URL,
    signingKeyPair: nacl.sign.keyPair.fromSecretKey(hexDecode(SERVER_ENV.IDOS_ISSUER_SECRET_KEY)),
  });
  const proofMessage = await issuer.addWalletMessage({
    address,
    wallet_type: walletType.data,
    user_id: userId,
    not_before: walletNotBefore,
    not_after: walletNotAfter,
  });

  session.set("proofMessage", proofMessage);
  session.set("profileUserId", userId);
  session.set("walletNotBefore", walletNotBefore);
  session.set("walletNotAfter", walletNotAfter);

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
  encryptionPasswordStore: z.enum(["user", "mpc", "mm"]),
  walletType: z.enum(WalletType),
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

  const walletNotBefore = session.get("walletNotBefore");
  const walletNotAfter = session.get("walletNotAfter");

  if (
    !session.get("profileUserId") ||
    !session.get("proofMessage") ||
    !walletNotBefore ||
    !walletNotAfter
  ) {
    return Response.json({ error: "User ID or proof message not found" }, { status: 400 });
  }

  const issuer = await idOSIssuer.init({
    nodeUrl: COMMON_ENV.IDOS_NODE_URL,
    signingKeyPair: nacl.sign.keyPair.fromSecretKey(hexDecode(SERVER_ENV.IDOS_ISSUER_SECRET_KEY)),
  });

  const {
    recipientEncryptionPublicKey,
    encryptionPasswordStore,
    walletAddress,
    walletPublicKey,
    signature,
    walletType,
  } = profileData;

  try {
    await issuer.createUser(
      {
        id: session.get("profileUserId"),
        recipient_encryption_public_key: recipientEncryptionPublicKey,
        encryption_password_store: encryptionPasswordStore,
      },
      {
        address: walletAddress,
        public_key: walletPublicKey,
        wallet_type: walletType,
        signature: signature,
        not_before: walletNotBefore,
        not_after: walletNotAfter,
      },
    );
  } catch (error) {
    console.error("Failed to create user", error);
    Sentry.captureException(error);
    return Response.json({ error: "Failed to create user" }, { status: 500 });
  }

  session.unset("proofMessage");
  session.unset("profileUserId");
  session.unset("walletNotBefore");
  session.unset("walletNotAfter");

  return Response.json(
    { profileCreated: true },
    {
      headers: {
        "Set-Cookie": await sessionStorage.commitSession(session),
      },
    },
  );
}
