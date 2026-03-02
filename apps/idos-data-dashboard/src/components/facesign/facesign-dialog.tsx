import { QRCodeSVG } from "qrcode.react";
import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { COMMON_ENV } from "@/core/envFlags.common";

const HANDOFF_POLL_INTERVAL_MS = 3_000;
const HANDOFF_TIMEOUT_MS = 5 * 60 * 1000;

type HandoffStatus = "idle" | "waiting" | "completed" | "error";

interface FacesignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onContinue: () => void;
  onMobileHandoffComplete?: (attestationToken: string) => void;
  isLoading?: boolean;
}

export function FacesignDialog({
  open,
  onOpenChange,
  onContinue,
  onMobileHandoffComplete,
  isLoading,
}: FacesignDialogProps) {
  const [handoffStatus, setHandoffStatus] = useState<HandoffStatus>("idle");
  const [qrUrl, setQrUrl] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  const cleanup = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setHandoffStatus("idle");
    setQrUrl("");
  }, []);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) cleanup();
      onOpenChange(nextOpen);
    },
    [onOpenChange, cleanup],
  );

  const startMobileHandoff = useCallback(async () => {
    const enclaveUrl = COMMON_ENV.FACESIGN_ENCLAVE_URL;
    if (!enclaveUrl) return;

    try {
      const response = await fetch(`${enclaveUrl}/api/handoff`, { method: "POST" });
      if (!response.ok) throw new Error("Failed to create handoff session");

      const { sessionId, secret } = await response.json();
      setQrUrl(`${enclaveUrl}/m/${sessionId}`);
      setHandoffStatus("waiting");

      const abortController = new AbortController();
      abortRef.current = abortController;

      const attestationToken = await pollForCompletion(
        `${enclaveUrl}/api/handoff/${sessionId}?secret=${encodeURIComponent(secret)}`,
        abortController.signal,
      );

      setHandoffStatus("completed");
      onMobileHandoffComplete?.(attestationToken);
    } catch (error) {
      if ((error as Error).name === "AbortError") return;
      console.error("Mobile handoff failed:", error);
      setHandoffStatus("error");
    }
  }, [onMobileHandoffComplete]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <img
            src="/facesign-logo.svg"
            alt="idOS FaceSign"
            width={130}
            height={60}
            className="mx-auto"
          />
        </DialogHeader>

        {handoffStatus === "idle" ? (
          <DefaultView
            onContinue={onContinue}
            onMobileHandoff={startMobileHandoff}
            isLoading={isLoading}
          />
        ) : (
          <MobileHandoffView status={handoffStatus} qrUrl={qrUrl} onCancel={cleanup} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function DefaultView({
  onContinue,
  onMobileHandoff,
  isLoading,
}: {
  onContinue: () => void;
  onMobileHandoff: () => void;
  isLoading?: boolean;
}) {
  return (
    <>
      <div className="flex flex-col items-center gap-6">
        <div className="relative flex size-48 items-center justify-center">
          <img
            src="/facesign-ring.svg"
            alt=""
            width={192}
            height={192}
            className="absolute inset-0 size-full"
          />
          <img src="/facesign-filled.svg" alt="" width={80} height={80} className="relative" />
        </div>
        <h2 className="text-center text-lg">Scan your Face to Continue</h2>
        <p className="text-center text-muted-foreground text-sm">
          Scan your face to log in with FaceSign or enroll if you're new.
        </p>
      </div>
      <DialogFooter className="flex flex-col gap-4 sm:flex-col">
        <Button size="lg" className="w-full" onClick={onMobileHandoff} disabled={isLoading}>
          Continue on Mobile
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="w-full"
          onClick={onContinue}
          isLoading={isLoading}
        >
          Continue on this device
        </Button>
      </DialogFooter>
    </>
  );
}

function MobileHandoffView({
  status,
  qrUrl,
  onCancel,
}: {
  status: HandoffStatus;
  qrUrl: string;
  onCancel: () => void;
}) {
  return (
    <>
      <div className="flex flex-col items-center gap-6">
        {status === "waiting" && (
          <>
            <div className="rounded-xl border bg-white p-3">
              <QRCodeSVG value={qrUrl} size={200} level="M" />
            </div>
            <h2 className="text-center text-lg">Scan with your phone</h2>
            <p className="text-center text-muted-foreground text-sm">
              Open the camera app on your mobile device and scan the QR code to complete the face
              verification.
            </p>
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Spinner className="size-4" />
              Waiting for mobile verification...
            </div>
          </>
        )}

        {status === "completed" && (
          <>
            <h2 className="text-center text-lg">Verification received</h2>
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Spinner className="size-4" />
              Completing setup...
            </div>
          </>
        )}

        {status === "error" && (
          <>
            <h2 className="text-center text-lg">Something went wrong</h2>
            <p className="text-center text-destructive text-sm">
              The mobile verification failed or timed out. Please try again.
            </p>
          </>
        )}
      </div>
      <DialogFooter>
        <Button size="lg" variant="outline" className="w-full" onClick={onCancel}>
          Cancel
        </Button>
      </DialogFooter>
    </>
  );
}

async function pollForCompletion(url: string, signal: AbortSignal): Promise<string> {
  const deadline = Date.now() + HANDOFF_TIMEOUT_MS;

  while (Date.now() < deadline) {
    signal.throwIfAborted();
    await new Promise((resolve) => setTimeout(resolve, HANDOFF_POLL_INTERVAL_MS));
    signal.throwIfAborted();

    const response = await fetch(url, { signal });
    if (!response.ok) continue;

    const data = await response.json();
    if (data.status === "completed" && data.attestationToken) {
      return data.attestationToken;
    }
  }

  throw new Error("Mobile handoff timed out");
}
