import { NextResponse } from "next/server";

export async function GET() {
  // Simulate some processing delay
  await new Promise((resolve) => setTimeout(resolve, 800));

  // Mock Hifi ToS URL - in reality this would call the actual Hifi API
  const mockTosUrl = "https://sandbox.hifi.finance/tos/accept?idempotencyKey=mock-agreement-123";

  return NextResponse.json({
    link: mockTosUrl,
    idempotencyKey: "mock-agreement-123",
    message: "Mock Hifi ToS URL generated successfully",
  });
}
