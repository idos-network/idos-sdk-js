import { createFundingAddress } from "~/providers/due.server";
import type { Route } from "./+types/funding-address";

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const payload = await request.json();
    const { transfer, accountId } = payload ?? {};

    if (!transfer) {
      return Response.json(
        {
          error: "transfer is required.",
        },
        { status: 400 },
      );
    }

    const dueAccountId = accountId;
    const fundingAddress = await createFundingAddress(dueAccountId, {
      transfer,
    });

    return Response.json(fundingAddress);
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}
