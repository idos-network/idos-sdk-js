import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import { Spinner } from "@/components/ui/spinner";
import { getEntropy } from "@/lib/api";
import { faceTec } from "@/lib/facetec";
import { useKeyStorageContext } from "@/providers/key.provider";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: (search.redirect as string | undefined) ?? "/wallet",
  }),
  component: Login,
});

function Login() {
  const router = useRouter();
  const { setMnemonic, isKeyAvailable } = useKeyStorageContext();
  const { redirect } = Route.useSearch();

  useEffect(() => {
    if (isKeyAvailable) {
      router.navigate({ to: redirect });
    }
  }, [isKeyAvailable, redirect, router]);

  useEffect(() => {
    faceTec.init((errorMessage, attestationToken, newUserConfirmationToken) => {
      if (errorMessage) {
        router.navigate({
          to: "/error",
          search: { message: errorMessage, token: undefined, redirect },
        });
        return;
      }

      if (attestationToken) {
        getEntropy(attestationToken).then((data) => {
          setMnemonic(data.entropy);
        });
      } else if (newUserConfirmationToken) {
        router.navigate({
          to: "/error",
          search: {
            message: "No FaceSign profile found",
            token: newUserConfirmationToken,
            redirect,
          },
        });
      } else {
        console.error("Unexpected state: neither errorMessage nor token is set");
      }
    });
  }, [router, setMnemonic]);

  return (
    <div className="flex h-svh items-center justify-center bg-background">
      <Spinner className="size-8" />
    </div>
  );
}
