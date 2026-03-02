import { createFxQuote } from "~/providers/due.server";
import type { Route } from "./+types/due";

export async function loader() {
  return Response.json({ message: "Use POST to get a quote" }, { status: 405 });
}

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const payload = await request.json();
    const { currencyIn, currencyOut, amountIn, amountOut, accountId } = payload ?? {};

    if (!currencyIn || !currencyOut || (!amountIn && !amountOut) || (amountIn && amountOut)) {
      return Response.json(
        {
          error: "currencyIn, currencyOut and exactly one of amountIn or amountOut are required.",
        },
        { status: 400 },
      );
    }

    const dueAccountId = accountId;
    const quote = await createFxQuote(dueAccountId, {
      currencyIn: String(currencyIn),
      currencyOut: String(currencyOut),
      amountIn: amountIn !== undefined ? +amountIn : undefined,
      amountOut: amountOut !== undefined ? +amountOut : undefined,
    });

    return Response.json(quote);
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}
