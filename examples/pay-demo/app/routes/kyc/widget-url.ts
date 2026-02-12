import { userContext } from "~/middlewares/auth";
import { createTransakWidgetUrl } from "~/providers/transak.server";
import type { Route } from "./+types/widget-url";

export async function action({ request, context }: Route.ActionArgs) {
  const user = context.get(userContext);

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { walletAddress, fiatAmount, kycShareToken, credentialId } = await request.json();

    if (!walletAddress || !kycShareToken || !credentialId) {
      return Response.json(
        { error: "walletAddress, kycShareToken, and credentialId are required" },
        { status: 400 },
      );
    }

    const referrerDomain = new URL(request.url).origin;

    const widgetUrl = await createTransakWidgetUrl({
      walletAddress,
      fiatAmount: fiatAmount ?? "100",
      kycShareToken,
      credentialId,
      referrerDomain,
    });

    return Response.json({ widgetUrl });
  } catch (error) {
    console.error("Error creating Transak widget URL:", error);
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}
