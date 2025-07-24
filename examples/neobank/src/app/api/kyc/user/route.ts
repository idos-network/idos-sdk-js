import { type NextRequest, NextResponse } from "next/server";
import { setCookieValue } from "@/lib/cookies";

export interface SessionUser {
  address: string;
  userId: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const address = searchParams.get("address");

    if (!userId || !address) {
      return NextResponse.json(
        { error: "Both userId and address parameters are required" },
        { status: 400 },
      );
    }

    // refactor to fernando's session storage
    // Store in cookies
    setCookieValue("userId", userId);
    setCookieValue("userAddress", address);

    return NextResponse.json({
      success: true,
      message: "User info stored in cookies successfully",
      user: { userId, address },
    });
  } catch (error) {
    console.error("Error storing user info:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
