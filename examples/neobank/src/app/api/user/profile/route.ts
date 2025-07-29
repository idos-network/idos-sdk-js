import { NextResponse } from "next/server";
import { clearUserCookies, getUserFromCookies } from "@/lib/cookies";

export async function GET() {
  try {
    const { userId, userAddress } = await getUserFromCookies();

    if (!userId || !userAddress) {
      return NextResponse.json({ error: "No user data found in cookies" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: {
        userId,
        userAddress,
      },
    });
  } catch (error) {
    console.error("Error reading user cookies:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    await clearUserCookies();

    return NextResponse.json({
      success: true,
      message: "User cookies cleared successfully",
    });
  } catch (error) {
    console.error("Error clearing user cookies:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
