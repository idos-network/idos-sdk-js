import { Button } from "@/components/ui/button";

interface ErrorCardProps {
  onRetry?: () => void;
  reset?: () => void;
}

export function ErrorCard({ onRetry, reset }: ErrorCardProps) {
  const handler = onRetry ?? reset;

  return (
    <div className="flex items-center flex-col lg:flex-row  gap-2.5 p-5 bg-neutral-900 rounded-xl h-20">
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
