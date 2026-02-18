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
    <div className="flex flex-1 flex-col items-stretch gap-5">
      <div className="flex h-14 items-center justify-between rounded-xl bg-card p-5 lg:h-20">
        <h1 className="block font-bold text-2xl lg:text-3xl">Wallets</h1>
      </div>
      <ErrorCard onRetry={handleRetry} />
    </div>
  );
}
