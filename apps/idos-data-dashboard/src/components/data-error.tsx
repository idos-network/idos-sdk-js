import { Button } from "@/components/ui/button";

type DataErrorProps = {
  onRetry: () => void;
};

export const DataError = ({ onRetry }: DataErrorProps) => {
  return (
    <div className="flex flex-col items-center gap-2.5 rounded-xl bg-neutral-900 p-5 lg:flex-row">
      <span className="text-red-500" role="alert">
        Something went wrong, please retry.
      </span>
      <Button variant="secondary" onClick={onRetry}>
        Retry
      </Button>
    </div>
  );
};
