import { createFileRoute } from "@tanstack/react-router";
import { WalletsSection } from "./dashboard/wallets/index";

export const Route = createFileRoute("/wallets")({
  component: WalletsSection,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      "add-wallet": search["add-wallet"],
      callbackUrl: search.callbackUrl,
      publicKey: search.publicKey,
    };
  },
});
