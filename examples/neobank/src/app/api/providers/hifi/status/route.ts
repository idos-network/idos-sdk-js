import { type NextRequest, NextResponse } from "next/server";
import type { KYCStatusResponse, UsdEuro } from "../user/route";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  try {
    const status = await getKycStatus(userId);
    return NextResponse.json({ status });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

const getKycStatus = async (hifiUserId: string): Promise<UsdEuro> => {
  const response = await fetch(`${process.env.HIFI_API_URL}v2/users/${hifiUserId}/kyc/status`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${process.env.HIFI_API_KEY}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    console.log("-> error", JSON.stringify(error, null, 2));
    throw new Error(`Can't get KYC status in HIFI because: ${error.message}`);
  }

  const data = (await response.json()) as KYCStatusResponse;

  return data.USD_EURO;
};
