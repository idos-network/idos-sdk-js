import { Spinner } from "@/components/ui/spinner";

interface ProposalWaitingProps {
  message: string;
  timedOut: boolean;
  onBack: () => void;
}

export function ProposalWaiting({ message, timedOut, onBack }: ProposalWaitingProps) {
  if (timedOut) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-4 p-6">
        <p className="text-center font-medium text-destructive">Request timed out</p>
        <p className="text-center text-muted-foreground text-sm">
          No request was received. Please try again.
        </p>
        <button
          type="button"
          onClick={onBack}
          className="rounded-md px-4 py-2 text-primary text-sm underline underline-offset-2"
        >
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 p-6">
      <Spinner className="size-8" />
      <p className="text-center text-muted-foreground text-sm">{message}</p>
    </div>
  );
}
