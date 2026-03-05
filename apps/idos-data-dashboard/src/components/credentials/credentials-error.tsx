import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { ErrorCard } from "@/components/error-card";

interface CredentialsErrorProps {
  reset?: () => void;
}

export function CredentialsError({ reset }: CredentialsErrorProps) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const handleRetry = () => {
    queryClient.removeQueries({ queryKey: ["credentials"] });
    reset?.();
    navigate("/");
  };

  return (
    <div className="flex flex-1 flex-col items-stretch gap-5">
      <div className="flex h-14 items-center justify-between rounded-xl bg-card p-5 lg:h-20">
        <h1 className="block font-bold text-2xl lg:text-3xl">Credentials</h1>
      </div>
      <ErrorCard onRetry={handleRetry} />
    </div>
  );
}
