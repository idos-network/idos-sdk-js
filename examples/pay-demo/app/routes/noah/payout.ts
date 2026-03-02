import { submitNoahPayout } from "~/providers/noah.server";
import type { Route } from "./+types/payout";

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const payload = await request.json();
    const {
      customerId,
      cryptoCurrency,
      fiatAmount,
      cryptoAuthorizedAmount,
      formSessionId,
      externalId,
    } = payload ?? {};

    if (
      !customerId ||
      !cryptoCurrency ||
      !fiatAmount ||
      !cryptoAuthorizedAmount ||
      !formSessionId
    ) {
      return Response.json(
        {
          error:
            "customerId, cryptoCurrency, fiatAmount, cryptoAuthorizedAmount, and formSessionId are required",
        },
        { status: 400 },
      );
    }

    const result = await submitNoahPayout(
      customerId,
      cryptoCurrency,
      fiatAmount,
      cryptoAuthorizedAmount,
      formSessionId,
      externalId,
    );

    return Response.json(result);
  } catch (error) {
    console.error("Error submitting Noah payout:", error);
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}
