import { createFileRoute } from "@tanstack/react-router";
import { Spinner } from "@/components/ui/spinner";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 p-6">
      <Spinner className="size-8" />
      <p className="text-center text-muted-foreground text-sm">Waiting for requests...</p>
    </div>
  );
}
