import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { ErrorCard } from "@/components/error-card";

interface CredentialsErrorProps {
  reset?: () => void;
}

export function CredentialsError({ reset }: CredentialsErrorProps) {
  const queryClient = useQueryClient();
  const router = useRouter();

  const handleRetry = () => {
    queryClient.removeQueries({ queryKey: ["credentials"] });
    reset?.();
    router.invalidate();
  };

  return (
    <div className="flex flex-1 flex-col items-stretch gap-5">
      <div className="flex h-20 items-center justify-between rounded-xl bg-card p-5">
        <h1 className="block font-bold text-2xl md:text-3xl">Credentials</h1>
      </div>
      <ErrorCard onRetry={handleRetry} />
    </div>
  );
}
