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
    <div className="flex flex-col items-stretch flex-1 gap-5">
      <div className="flex justify-between items-center p-5 h-20 bg-neutral-900 rounded-xl">
        <h1 className="block text-2xl md:text-3xl font-bold">Credentials</h1>
      </div>
      <ErrorCard onRetry={handleRetry} />
    </div>
  );
}
