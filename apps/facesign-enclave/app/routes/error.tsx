import { AlertCircleIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { confirmNewUser, getEntropy } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useKeyStorageContext } from "@/providers/key.provider";

function NewUserView({ token, redirect }: { token: string; redirect: string }) {
  const navigate = useNavigate();
  const { setMnemonic, isKeyAvailable } = useKeyStorageContext();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isKeyAvailable) {
      navigate(redirect);
    }
  }, [isKeyAvailable, redirect, navigate]);

  async function handleCreate() {
    setIsCreating(true);
    setError(null);

    try {
      const { userAttestmentToken } = await confirmNewUser(token);
      const { entropy } = await getEntropy(userAttestmentToken);
      await setMnemonic(entropy);
    } catch (e) {
      console.error("[FaceSign] Account creation failed:", e);
      setError(e instanceof Error ? e.message : "Failed to create FaceSign account.");
      setIsCreating(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-6">
      <img src="/facesign-error.svg" alt="idOS FaceSign" width={80} height={80} />
      <div className="flex max-w-sm flex-col items-center justify-center gap-4 text-center">
        <h2 className="font-medium text-xl">No FaceSign profile found</h2>
        <p className="text-muted-foreground text-sm">
          If we couldn't log you in with FaceSign, you're likely not enrolled yet. Let's create your
          idOS Profile and turn on Login with FaceSign.
        </p>
        {error ? (
          <Alert variant="destructive">
            <AlertCircleIcon className="size-6" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        <div className="flex w-full flex-col gap-2">
          <Link
            to={`/login?redirect=${encodeURIComponent(redirect)}`}
            className={cn(buttonVariants({ size: "lg" }), "w-full")}
          >
            I have an account! Try Again
          </Link>
          <Button
            variant="outline"
            size="lg"
            className="w-full"
            isLoading={isCreating}
            onClick={handleCreate}
          >
            Create FaceSign Account
          </Button>
        </div>
      </div>
    </div>
  );
}

function GenericErrorView({ message, redirect }: { message: string; redirect: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-6">
      <img src="/facesign-error.svg" alt="idOS FaceSign" width={80} height={80} />
      <div className="flex flex-col items-center justify-center gap-4">
        <h2 className="text-center text-xl">An error occurred</h2>
        <Alert variant="destructive">
          <AlertCircleIcon className="size-6" />
          <AlertDescription>{message}</AlertDescription>
        </Alert>
        <Link
          to={`/login?redirect=${encodeURIComponent(redirect)}`}
          className={cn(buttonVariants({ size: "lg" }))}
        >
          Try again
        </Link>
      </div>
    </div>
  );
}

export default function AppError() {
  const [searchParams] = useSearchParams();

  const message = searchParams.get("message") ?? "An unexpected error occurred";
  const token = searchParams.get("token");
  const redirect = searchParams.get("redirect") ?? "/wallet";

  if (token) {
    return <NewUserView token={token} redirect={redirect} />;
  }

  return <GenericErrorView message={message} redirect={redirect} />;
}
