import { Button } from "@/components/ui/button";

/** Props for the ErrorCard component. */
interface ErrorCardProps {
  /** Callback to retry the failed action while preserving current state. */
  onRetry?: () => void;
  /** Callback to clear error state and reset to initial defaults (provided by TanStack Router error boundaries). */
  reset?: () => void;
}

export function ErrorCard({ onRetry, reset }: ErrorCardProps) {
  const handler = onRetry ?? reset;

  return (
    <div className="flex min-h-20 flex-col items-center gap-2.5 rounded-xl bg-card p-5 lg:flex-row">
      <span className="text-red-500" role="alert">
        Something went wrong, please retry.
      </span>
      {handler ? (
        <Button variant="secondary" onClick={handler}>
          Retry
        </Button>
      ) : null}
    </div>
  );
}
