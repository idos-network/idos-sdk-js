import { Button } from "@/components/ui/button";

interface ErrorCardProps {
  onRetry?: () => void;
  reset?: () => void;
}

export function ErrorCard({ onRetry, reset }: ErrorCardProps) {
  const handler = onRetry ?? reset;

  return (
    <div className="flex h-20 flex-col items-center gap-2.5 rounded-xl bg-card p-5 lg:flex-row">
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
