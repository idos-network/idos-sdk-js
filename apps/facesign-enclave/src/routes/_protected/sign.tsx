import { utf8Decode } from "@idos-network/utils/codecs";
import { createFileRoute } from "@tanstack/react-router";
import { AlertCircleIcon } from "lucide-react";
import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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

  if (!firstProposal) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-4 p-6">
        <Spinner className="size-8" />
        <p className="text-center text-muted-foreground text-sm">Waiting for sign request...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 p-6">
      <h1 className="text-center text-xl">Sign Approval</h1>
      <p className="text-center text-muted-foreground">
        Please review the sign proposal details below and choose to approve or reject the request.
      </p>

      <Alert className="w-full max-w-md">
        <AlertCircleIcon className="size-6" />
        <AlertTitle>{firstProposal.metadata.name}</AlertTitle>
        <AlertDescription>{utf8Decode(firstProposal.data as Uint8Array)}</AlertDescription>
      </Alert>

      <div className="flex w-full max-w-md justify-between gap-4">
        <Button
          type="button"
          onClick={handleReject}
          disabled={!!processingAction}
          variant="destructive"
          size="lg"
          className="min-w-0 flex-1"
        >
          {processingAction === "reject" ? "Processing..." : "Reject"}
        </Button>
        <Button
          type="button"
          onClick={handleApprove}
          disabled={!!processingAction}
          size="lg"
          className="min-w-0 flex-1"
        >
          {processingAction === "approve" ? "Processing..." : "Sign"}
        </Button>
      </div>
    </div>
  );
}
