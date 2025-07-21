import { NextResponse } from "next/server";

export async function GET() {
  // Simulate some processing delay
  await new Promise((resolve) => setTimeout(resolve, 1200));

  // Mock Transak sharable token - in reality this would call the actual Transak/Kraken API
  const mockToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock-transak-token-payload.signature";

  return NextResponse.json({
    token: mockToken,
    expiresIn: 3600, // 1 hour
    message: "Mock Transak sharable token generated successfully",
  });
}
