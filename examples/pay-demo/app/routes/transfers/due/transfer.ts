import { createTransfer, getTransfer } from "~/providers/due.server";
import type { Route } from "./+types/transfer";

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const payload = await request.json();
    const { quote, recipient, memo, accountId } = payload ?? {};

    if (!quote || !recipient) {
      return Response.json(
        {
          error: "quote and recipient are required.",
        },
        { status: 400 },
      );
    }

    const dueAccountId = accountId;
    const transfer = await createTransfer(dueAccountId, {
      quote,
      recipient,
      memo,
    });

    return Response.json(transfer);
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function loader({ params, request }: Route.LoaderArgs) {
  const transferId = (params as { transferId: string }).transferId;

  // Only handle GET requests with transferId
  if (!transferId) {
    return Response.json({ error: "transferId is required" }, { status: 400 });
  }

  try {
    // Get accountId from query params or use env var as fallback
    const url = new URL(request.url);
    const accountId = url.searchParams.get("accountId");
    const dueAccountId = accountId;
    if (!dueAccountId) {
      return Response.json({ error: "accountId is required" }, { status: 400 });
    }

    const transfer = await getTransfer(dueAccountId, transferId);
    return Response.json(transfer);
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}
