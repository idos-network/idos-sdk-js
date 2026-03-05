import { getUserByDueId, setUserItem } from "~/providers/store.server";
import type { Route } from "./+types/due";

export interface DueKycEvent {
  id: string;
  type: "bp.kyc.status_changed" | "transfer.status_changed" | "bp.tos_accepted";
  data: {
    id: string;
    kyc: {
      status: "passed" | "failed";
    };
  };
}

export async function action({ request }: Route.ActionArgs) {
  const body = (await request.json()) as DueKycEvent;

  // TODO: Security checks

  if (body.type !== "bp.kyc.status_changed") {
    return Response.json({ error: "Invalid event type" }, { status: 400 });
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
