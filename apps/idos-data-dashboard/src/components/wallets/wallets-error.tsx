import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { ErrorCard } from "@/components/error-card";

interface WalletsErrorProps {
  reset?: () => void;
}

export function WalletsError({ reset }: WalletsErrorProps) {
  const queryClient = useQueryClient();
  const router = useRouter();

  const handleRetry = () => {
    queryClient.removeQueries({ queryKey: ["wallets"] });
    reset?.();
    router.invalidate();
  };

  return (
    <div className="flex flex-col items-stretch gap-5 flex-1">
      <div className="flex items-center justify-between h-14 lg:h-20 p-5 bg-neutral-900 rounded-xl">
        <h1 className="block text-2xl lg:text-3xl font-bold">Wallets</h1>
      </div>
      <ErrorCard onRetry={handleRetry} />
    </div>
  );
}
