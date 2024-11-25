import prisma from "@/app/lib/db";
import { createCredentials, createHumanProfile, insertDAG } from "@/app/lib/idos/backend";
import { Prisma } from "@prisma/client";
import { NextRequest } from "next/server";
import { auth } from "../../auth";

export const maxDuration = 60; // 1 minute max duration

export async function POST(request: NextRequest) {
  const currentUser = await auth();
  if (!currentUser?.user)
    return Response.json({ error: "User is not authenticated" }, { status: 401 });

  const data: Record<string, string | number> = await request.json();

  const update: Prisma.UserUpdateInput = {};

  // Pick just known keys to be sure
  [
    "idosPubKey",
    "idosGrantOwner",
    "idosGrantGrantee",
    "idosGrantDataId",
    "idosGrantLockedUntil",
    "idosGrantMessage",
    "idosGrantSignature",
  ].forEach((key) => {
    // @ts-expect-error Not yet fully typed
    if (data[key]) update[key] = data[key];
  });

  if (Object.keys(update).length > 0) {
    await prisma.user.update({
      // @ts-expect-error Not yet fully typed
      where: { address: currentUser.user.address },
      data: update,
    });
  }

  // Reload user
  const dbUser = await prisma.user.findFirstOrThrow({
    // @ts-expect-error Not yet fully typed
    where: { address: currentUser.user.address },
  });

  // If public key is provided, but no idos profile, then we can create a new one
  if (dbUser.idosPubKey && !dbUser.idosHumanId) {
    const { idosHumanId, idosWalletId } = await createHumanProfile(dbUser);

    await prisma.user.update({
      // @ts-expect-error Not yet fully typed
      where: { address: currentUser.user.address },
      data: { idosHumanId, idosWalletId },
    });

    // Set to not re-fetch user from the database
    dbUser.idosHumanId = idosHumanId;
    dbUser.idosWalletId = idosWalletId;
  }

  // If data.publicKey is provided, then we can update the user's IDOS human profile
  if (dbUser.idosPubKey && !dbUser.idosCredentialId) {
    // The object is not re-fetched from the database, so we are passing
    // required human id to credentials.
    const idosCredentialId = await createCredentials(dbUser);

    await prisma.user.update({
      // @ts-expect-error Not yet fully typed
      where: { address: currentUser.user.address },
      data: { idosCredentialId },
    });
  }

  if (!dbUser.idosGrantTransactionId && dbUser.idosGrantMessage && dbUser.idosGrantSignature) {
    const transactionId = await insertDAG(dbUser);

    await prisma.user.update({
      // @ts-expect-error Not yet fully typed
      where: { address: currentUser.user.address },
      data: { idosGrantTransactionId: transactionId },
    });
  }

  return Response.json({ response: "ok" });
}
