import { prepareNoahPayout } from "~/providers/noah.server";
import type { Route } from "./+types/payout-prepare";

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const payload = await request.json();
    const { customerId, channelId, cryptoCurrency, fiatAmount, form, paymentMethod } =
      payload ?? {};

    if (!customerId || !channelId || !cryptoCurrency || !fiatAmount || !form) {
      return Response.json(
        {
          error: "customerId, channelId, cryptoCurrency, fiatAmount, and form are required",
        },
        { status: 400 },
      );
    }

    const result = await prepareNoahPayout(
      customerId,
      channelId,
      cryptoCurrency,
      fiatAmount,
      form,
      paymentMethod,
    );

    return Response.json(result);
  } catch (error) {
    console.error("Error preparing Noah payout:", error);
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}
