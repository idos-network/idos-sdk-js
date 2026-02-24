import { utf8Decode } from "@idos-network/utils/codecs";
import { createFileRoute } from "@tanstack/react-router";
import { XIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useKeyStorageContext } from "@/providers/key.provider";
import { useRequests } from "@/providers/requests.provider";

export const Route = createFileRoute("/_protected/sign")({
  component: Sign,
});

type ProcessingAction = "approve" | "reject" | null;

function Sign() {
  const { sign } = useKeyStorageContext();
  const { signProposals } = useRequests();
  const [processingAction, setProcessingAction] = useState<ProcessingAction>(null);

  const firstProposal = signProposals[0];

  const handleApprove = async () => {
    if (!firstProposal || processingAction) return;
    setProcessingAction("approve");
    try {
      const signature = await sign(firstProposal.data);
      firstProposal.callback(signature);
    } finally {
      setProcessingAction(null);
    }
  };

  const handleReject = async () => {
    if (!firstProposal || processingAction) return;
    setProcessingAction("reject");
    try {
      firstProposal.callback(null);
    } finally {
      setProcessingAction(null);
    }
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleReject();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  if (!firstProposal) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-4 p-6">
        <Spinner className="size-8" />
        <p className="text-center text-muted-foreground text-sm">Waiting for sign request...</p>
      </div>
    );
  }

  return (
    <div
      role="dialog"
      className="fixed inset-0 flex items-center justify-center bg-background p-6"
      onMouseDown={(e) => e.button === 0 && handleReject()}
    >
      {/* biome-ignore lint/a11y/noStaticElementInteractions: stop propagation for backdrop dismiss */}
      <div
        className="relative flex w-full max-w-sm flex-col gap-5 rounded-xl bg-card p-6 shadow-xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <Button
          type="button"
          variant="ghost"
          size="lg"
          onClick={handleReject}
          disabled={!!processingAction}
          className="absolute top-2 right-2"
        >
          <XIcon />
          <span className="sr-only">Close</span>
        </Button>

        <div className="flex justify-center">
          <img alt="idOS FaceSign" src="/facesign-logo.svg" width={130} height={61} />
        </div>

        <div className="flex flex-col gap-3">
          <h1 className="text-center font-medium text-base">Signature Request</h1>
          <p className="text-center text-muted-foreground text-sm">
            Review request details before you confirm.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2 rounded-lg bg-muted p-4">
            <p className="font-medium text-sm">Request from</p>
            <p className="text-muted-foreground text-sm">{firstProposal.metadata.name}</p>
          </div>

          <div className="flex flex-col gap-2 rounded-lg bg-muted p-4">
            <p className="font-medium text-sm">Message</p>
            <p className="text-muted-foreground text-sm">{firstProposal.metadata.description}</p>
            <p className="mt-2 break-all font-mono text-muted-foreground text-xs">
              {utf8Decode(firstProposal.data as Uint8Array)}
            </p>
          </div>
        </div>

        <div className="flex justify-between gap-4">
          <Button
            type="button"
            onClick={handleReject}
            disabled={!!processingAction}
            variant="secondary"
            size="lg"
            className="min-w-0 flex-1"
          >
            {processingAction === "reject" ? "Processing..." : "Cancel"}
          </Button>
          <Button
            type="button"
            onClick={handleApprove}
            disabled={!!processingAction}
            size="lg"
            className="min-w-0 flex-1"
          >
            {processingAction === "approve" ? "Processing..." : "Confirm"}
          </Button>
        </div>
      </div>
    </div>
  );
}
