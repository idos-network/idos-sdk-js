import { getUserByDueId, setUserItem } from "~/providers/store.server";
import type { Route } from "./+types/due";

export interface DueKycEvent {
  id: string;
  type: "bp.kyc.status_changed" | "transfer.status_changed" | "bp.tos_accepted";
  data: {
    id: string;
    kyc?: {
      status: "passed" | "failed";
    };
    transfer?: {
      id: string;
      status: string;
    };
  };
}

export async function action({ request }: Route.ActionArgs) {
  const body = (await request.json()) as DueKycEvent;

  // TODO: Security checks

  if (body.type === "bp.kyc.status_changed") {
    if (!body.data.kyc) {
      return Response.json({ error: "KYC data missing" }, { status: 400 });
    }

    if (body.data.kyc.status !== "passed" && body.data.kyc.status !== "failed") {
      return Response.json({ error: "Invalid status" }, { status: 400 });
    }

    const userItem = await getUserByDueId(body.data.id);

    if (!userItem || !userItem.due) {
      return Response.json({ error: `User not found for due ID ${body.data.id}` }, { status: 400 });
    }

    userItem.due.kycStatus = body.data.kyc.status;

    await setUserItem(userItem);

    return Response.json({ message: "KYC status updated" });
  }

  if (body.type === "transfer.status_changed") {
    if (!body.data.transfer) {
      return Response.json({ error: "Transfer data missing" }, { status: 400 });
    }

    console.log(
      `Transfer ${body.data.transfer.id} status changed to: ${body.data.transfer.status}`,
    );

    // Here you could update a transfer status in your database
    // For now, we'll just log it
    // In a real implementation, you'd want to:
    // 1. Store transfer IDs when creating transfers
    // 2. Look up the transfer by ID
    // 3. Update its status
    // 4. Notify the user (via websocket, polling, etc.)

    return Response.json({ message: "Transfer status updated" });
  }

  return Response.json({ error: "Unsupported event type" }, { status: 400 });
}
