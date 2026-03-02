import { AlertCircleIcon, CheckCircle2Icon, SmartphoneIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { LoaderFunctionArgs } from "react-router";
import { data, useLoaderData } from "react-router";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { confirmNewUser } from "@/lib/api";
import { faceTec } from "@/lib/facetec";
import { sessionExists } from "@/lib/handoff-store";

export async function loader({ params }: LoaderFunctionArgs) {
  const sessionId = params.sessionId ?? "";
  const exists = await sessionExists(sessionId);
  if (!exists) {
    throw data("Session not found or expired", { status: 404 });
  }
  return { sessionId };
}

type PageState = "ready" | "scanning" | "submitting" | "success" | "error";

export default function MobileHandoff() {
  const { sessionId } = useLoaderData<typeof loader>();
  const [state, setState] = useState<PageState>("ready");
  const [error, setError] = useState<string | null>(null);
  const initialized = useRef(false);

  const submitToken = useCallback(
    async (attestationToken: string) => {
      setState("submitting");
      const response = await fetch(`/api/handoff/${sessionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attestationToken }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit result");
      }

      setState("success");
    },
    [sessionId],
  );

  const startScan = useCallback(async () => {
    if (initialized.current) return;
    initialized.current = true;

    setState("scanning");

    try {
      await faceTec.init(async (errorMessage, attestationToken, newUserConfirmationToken) => {
        if (errorMessage) {
          setError(errorMessage);
          setState("error");
          initialized.current = false;
          return;
        }

        try {
          if (attestationToken) {
            await submitToken(attestationToken);
          } else if (newUserConfirmationToken) {
            const { userAttestmentToken } = await confirmNewUser(newUserConfirmationToken);
            await submitToken(userAttestmentToken);
          } else {
            throw new Error("Unexpected state: no token received");
          }
        } catch (e) {
          console.error("[MobileHandoff] Error:", e);
          setError(e instanceof Error ? e.message : "An unexpected error occurred");
          setState("error");
          initialized.current = false;
        }
      });
    } catch (e) {
      console.error("[MobileHandoff] FaceTec init failed:", e);
      setError(e instanceof Error ? e.message : "Failed to initialize face scan");
      setState("error");
      initialized.current = false;
    }
  }, [submitToken]);

  useEffect(() => {
    return () => {
      initialized.current = false;
    };
  }, []);

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6">
      <img src="/facesign-logo.svg" alt="idOS FaceSign" width={64} height={64} />

      {state === "ready" && (
        <div className="flex max-w-sm flex-col items-center gap-4 text-center">
          <h1 className="font-semibold text-xl">FaceSign Verification</h1>
          <p className="text-muted-foreground text-sm">
            Complete a quick face scan to verify your identity. This will be linked to your desktop
            session.
          </p>
          <Button size="lg" className="w-full" onClick={startScan}>
            <SmartphoneIcon className="size-4" />
            Start Face Scan
          </Button>
        </div>
      )}

      {state === "scanning" && (
        <div className="flex flex-col items-center gap-4 text-center">
          <Spinner className="size-8" />
          <p className="text-muted-foreground text-sm">Face scan in progress...</p>
        </div>
      )}

      {state === "submitting" && (
        <div className="flex flex-col items-center gap-4 text-center">
          <Spinner className="size-8" />
          <p className="text-muted-foreground text-sm">Submitting verification...</p>
        </div>
      )}

      {state === "success" && (
        <div className="flex max-w-sm flex-col items-center gap-4 text-center">
          <CheckCircle2Icon className="size-12 text-green-500" />
          <h1 className="font-semibold text-xl">Verification Complete</h1>
          <p className="text-muted-foreground text-sm">
            You can now close this page and return to your desktop. Your session will continue
            automatically.
          </p>
        </div>
      )}

      {state === "error" && (
        <div className="flex max-w-sm flex-col items-center gap-4 text-center">
          <h1 className="font-semibold text-xl">Something went wrong</h1>
          <Alert variant="destructive">
            <AlertCircleIcon className="size-6" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button
            size="lg"
            className="w-full"
            onClick={() => {
              setError(null);
              startScan();
            }}
          >
            Try Again
          </Button>
        </div>
      )}
    </div>
  );
}
