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
      <div className="bg-card flex h-14 items-center justify-between rounded-xl p-5 lg:h-20">
        <h1 className="block text-2xl font-bold lg:text-3xl">My Data</h1>
      </div>
      <ErrorCard onRetry={handleRetry} />
    </div>
  );
}
