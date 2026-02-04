import { Button } from "@/components/ui/button";

type DataErrorProps = {
  onRetry: () => void;
};

export const DataError = ({ onRetry }: DataErrorProps) => {
  return (
    <div className="flex items-center flex-col lg:flex-row  gap-2.5 p-5 bg-neutral-900 rounded-xl">
      <span className="text-red-500">Something went wrong, please retry.</span>
      <Button variant="secondary" onClick={onRetry}>
        Retry
      </Button>
    </div>
  );
};
