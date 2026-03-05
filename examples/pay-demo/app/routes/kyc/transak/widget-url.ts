import { userContext } from "~/middlewares/auth.server";
import { createTransakWidgetUrl } from "~/providers/transak.server";
import type { Route } from "./+types/widget-url";

export async function action({ request, context }: Route.ActionArgs) {
  const user = context.get(userContext);

  try {
    const { walletAddress, fiatAmount, kycShareToken } = await request.json();

    if (!walletAddress || !kycShareToken || !user.sharedKyc?.sharedId) {
      return Response.json({ error: "walletAddress, kycShareToken are required" }, { status: 400 });
    }

    const referrerDomain = new URL(request.url).origin;

    const widgetUrl = await createTransakWidgetUrl({
      walletAddress,
      fiatAmount: fiatAmount ?? "100",
      kycShareToken,
      credentialId: user.sharedKyc.sharedId,
      referrerDomain,
    });

    return Response.json({ widgetUrl });
  } catch (error) {
    console.error("Error creating Transak widget URL:", error);
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}
