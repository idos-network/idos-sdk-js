import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useKeyStorageContext } from "@/providers/key.provider";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { isKeyAvailable } = useKeyStorageContext();
  const router = useRouter();

  useEffect(() => {
    if (isKeyAvailable) {
      router.navigate({ to: "/wallet" });
    }
  }, [isKeyAvailable, router]);

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-6">
      <img
        src="/facesign-logo.svg"
        alt="idOS FaceSign"
        className="mx-auto"
        width={180}
        height={84}
      />
      <p className="text-center text-accent-foreground">
        Get started by performing face verification to unlock your secure enclave.
      </p>

      <Link
        to="/login"
        search={{ redirect: "/wallet" }}
        className={cn(buttonVariants({ size: "lg" }))}
      >
        Get started
      </Link>
    </div>
  );
}
