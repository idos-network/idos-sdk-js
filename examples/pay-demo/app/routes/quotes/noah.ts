import { getNoahQuote } from "~/providers/quotes.server";
import type { Route } from "./+types/noah";

export async function loader() {
  return Response.json({ message: "Use POST to get a quote" }, { status: 405 });
}

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const payload = await request.json();
    const { sourceCurrency, destinationCurrency, amount } = payload ?? {};

    if (!sourceCurrency || !destinationCurrency || !amount) {
      return Response.json(
        { error: "sourceCurrency, destinationCurrency, and amount are required." },
        { status: 400 },
      );
    }

    const quote = await getNoahQuote({
      sourceCurrency: String(sourceCurrency),
      destinationCurrency: String(destinationCurrency),
      amount: String(amount),
    });

    return Response.json(quote);
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}
