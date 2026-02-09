import { createFileRoute } from "@tanstack/react-router";
import { WalletsSection } from "./wallets/index";

export const Route = createFileRoute("/dashboard/wallets")({
  component: WalletsSection,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      "add-wallet": (search["add-wallet"] as string) || undefined,
      callbackUrl: (search.callbackUrl as string) || undefined,
      publicKey: (search.publicKey as string) || undefined,
    };
  },
});
