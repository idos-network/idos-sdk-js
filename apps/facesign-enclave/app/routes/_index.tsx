import { Spinner } from "@/components/ui/spinner";

export default function Index() {
  return (
    <div className="bg-background flex min-h-svh flex-col items-center justify-center gap-4 p-6">
      <Spinner className="size-8" />
      <p className="text-muted-foreground text-center text-sm">Waiting for requests...</p>
    </div>
  );
}
