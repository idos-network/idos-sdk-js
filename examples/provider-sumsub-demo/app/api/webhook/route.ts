import prisma from "@/app/lib/db";
import type { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const data = await request.json();

  const address = data.externalUserId;

  if (data.type === "applicantReviewed") {
    let status = "none";
    if (data.reviewResult.reviewAnswer === "GREEN") {
      status = "approved";
    } else {
      status = "rejected";
    }

    await prisma.user.upsert({
      where: {
        address,
      },
      update: {
        sumSubStatus: status,
      },
      create: {
        address,
        sumSubStatus: status,
      },
    });
  }

  return Response.json({ message: "ok" });
}
