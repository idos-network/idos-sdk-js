import { createFileRoute } from "@tanstack/react-router";
import { WalletsSection } from "./wallets/index";

export const Route = createFileRoute("/dashboard/wallets")({
  component: WalletsSection,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      "add-wallet": search["add-wallet"],
      callbackUrl: search.callbackUrl,
      publicKey: search.publicKey,
    };
  },
});
