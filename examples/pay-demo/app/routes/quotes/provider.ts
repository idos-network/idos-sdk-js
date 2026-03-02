import { getProviderQuote } from "~/providers/quotes.server";
import type { Route } from "./+types/provider";

export async function loader({ request }: Route.LoaderArgs) {
  const { searchParams } = new URL(request.url);
  const provider = searchParams.get("provider") as "transak" | "noah" | null;
  const sourceCurrency = searchParams.get("sourceCurrency");
  const destinationCurrency = searchParams.get("destinationCurrency");
  const amount = searchParams.get("amount") ?? "100";

  if (!provider || !sourceCurrency || !destinationCurrency) {
    return Response.json(
      { error: "provider, sourceCurrency, and destinationCurrency are required." },
      { status: 400 },
    );
  }

  try {
    const quote = await getProviderQuote(provider, {
      sourceCurrency,
      destinationCurrency,
      amount,
    });

    return Response.json(quote);
  } catch (error) {
    console.error(`[quotes/provider] Error fetching ${provider} quote:`, error);
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}
