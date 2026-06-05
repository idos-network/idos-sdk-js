import { verifySignature } from "@idos-network/kwil-infra/signature-verification";
import crypto from "node:crypto";
import { z } from "zod";

import type { User } from "@/generated/prisma/client";

import { getDb } from "@/core/db.server";
import { sessionStorage } from "@/core/sessions.server";
import { WalletType } from "@/generated/prisma/enums";

import type { Route } from "./+types/login";

export async function loader({ request }: Route.LoaderArgs) {
  const session = await sessionStorage.getSession(request.headers.get("Cookie"));

  // Generate a message to sign to validate ownership of the wallet address
  const proofMessage = `Please sign this message to confirm you own this wallet address. Nonce ${crypto.randomUUID()}`;
  session.set("proofMessage", proofMessage);

  return Response.json(
    {
      proofMessage,
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
  walletType: z.enum(WalletType),
  walletPublicKey: z.string(),
  signature: z.string(),
});

export type ProfileData = z.infer<typeof ProfileSchema>;

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  let profileData: ProfileData;

  try {
    profileData = ProfileSchema.parse(await request.json());
  } catch (_error) {
    console.error("Invalid profile data", _error);
    return Response.json({ error: "Invalid profile data" }, { status: 400 });
  }

  const session = await sessionStorage.getSession(request.headers.get("Cookie"));
  const proofMessage = session.get("proofMessage");

  if (!proofMessage) {
    return Response.json({ error: "Proof message not found" }, { status: 400 });
  }

  try {
    const isValid = await verifySignature({
      address: profileData.walletAddress,
      message: proofMessage,
      signature: profileData.signature,
      wallet_type: profileData.walletType,
      public_key: [profileData.walletPublicKey],
    });

    if (!isValid) {
      throw new Error("Invalid signature");
    }
  } catch (error) {
    console.error("Error verifying signature", error);
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Create or use existing user
  const db = await getDb();

  // Non-EVM are verified by signature + public key
  // Evm are signature + address
  // same logic must be done for search in db
  let user: User;

  if (profileData.walletType === "EVM") {
    user = await db.user.upsert({
      where: {
        walletAddress_walletType: {
          walletAddress: profileData.walletAddress,
          walletType: profileData.walletType,
        },
      },
      update: {},
      create: {
        walletAddress: profileData.walletAddress,
        walletType: profileData.walletType,
      },
    });
  } else {
    user = await db.user.upsert({
      where: {
        walletPublicKey_walletType: {
          walletPublicKey: profileData.walletPublicKey,
          walletType: profileData.walletType,
        },
      },
      update: {},
      create: {
        walletType: profileData.walletType,
        walletPublicKey: profileData.walletPublicKey,
      },
    });
  }

  session.unset("proofMessage");
  session.set("userId", user.id);

  return Response.json(
    { loggedIn: true },
    {
      headers: {
        "Set-Cookie": await sessionStorage.commitSession(session),
      },
    },
  );
}
