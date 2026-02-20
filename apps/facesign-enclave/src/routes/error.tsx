import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertCircleIcon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/error")({
  validateSearch: (search: Record<string, unknown>) => ({
    message: (search.message as string | undefined) ?? "An unexpected error occurred",
  }),
  component: AppError,
});

function AppError() {
  const { message } = Route.useSearch();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-6">
      <img src="/facesign-error.svg" alt="idOS FaceSign" width={80} height={80} />
      <div className="flex flex-col items-center justify-center gap-4">
        <h2 className="text-center text-xl">An error occurred</h2>
        <Alert variant="destructive">
          <AlertCircleIcon className="size-6" />
          <AlertDescription>{message}</AlertDescription>
        </Alert>
        <Link
          to="/login"
          search={{ redirect: "/wallet" }}
          className={cn(buttonVariants({ size: "lg" }))}
        >
          Try again
        </Link>
      </div>
    </div>
  );
}
