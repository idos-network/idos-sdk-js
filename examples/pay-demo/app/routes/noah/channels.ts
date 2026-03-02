import { getNoahChannels } from "~/providers/noah.server";
import type { Route } from "./+types/channels";

export async function loader({ request }: Route.LoaderArgs) {
  const { searchParams } = new URL(request.url);
  const countryCode = searchParams.get("countryCode");
  const token = searchParams.get("token");
  const fiatCurrency = searchParams.get("fiatCurrency");
  const fiatAmount = searchParams.get("fiatAmount");

  if (!countryCode || !token || !fiatCurrency) {
    return Response.json(
      { error: "countryCode, token, and fiatCurrency are required" },
      { status: 400 },
    );
  }

  try {
    const channels = await getNoahChannels(
      countryCode,
      token,
      fiatCurrency,
      fiatAmount ? Number.parseFloat(fiatAmount) : undefined,
    );
    return Response.json(channels);
  } catch (error) {
    console.error("Error fetching Noah channels:", error);
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}
