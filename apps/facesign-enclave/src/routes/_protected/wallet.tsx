import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_protected/wallet")({
  component: Wallet,
});

function Wallet() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-6">
      <p className="text-center">Waiting for connection requests...</p>
    </div>
  );
}
