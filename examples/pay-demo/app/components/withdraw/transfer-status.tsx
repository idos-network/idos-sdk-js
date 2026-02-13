import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";

type TransferStatus = "awaiting_funds" | "processing" | "completed" | "failed";

interface TransferStatusProps {
  status: TransferStatus;
  source: { currency: string; amount: string };
  destination: { currency: string; amount: string };
  recipientName: string;
  onDone?: () => void;
}

const STATUS_CONFIG: Record<
  TransferStatus,
  {
    icon: typeof Loader2;
    title: string;
    description: string;
    iconClass: string;
    bgClass: string;
  }
> = {
  awaiting_funds: {
    icon: Loader2,
    title: "Awaiting Funds",
    description: "Waiting for the blockchain transaction to be confirmed",
    iconClass: "text-info-foreground animate-spin",
    bgClass: "bg-info/10",
  },
  processing: {
    icon: Loader2,
    title: "Transfer in Progress",
    description: "Your transfer is being processed. This may take a few minutes.",
    iconClass: "text-info-foreground animate-spin",
    bgClass: "bg-info/10",
  },
  completed: {
    icon: CheckCircle2,
    title: "Transfer Complete",
    description: "Funds have been sent to the recipient's bank account",
    iconClass: "text-success-foreground",
    bgClass: "bg-success/10",
  },
  failed: {
    icon: AlertCircle,
    title: "Transfer Failed",
    description: "Something went wrong with your transfer. Please try again.",
    iconClass: "text-destructive",
    bgClass: "bg-destructive/10",
  },
};

export function TransferStatusTracker({
  status,
  source,
  destination,
  recipientName,
  onDone,
}: TransferStatusProps) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;
  const isTerminal = status === "completed" || status === "failed";

  return (
    <Card className="mx-auto max-w-2xl shadow-sm gap-5">
      <CardHeader className="items-center text-center">
        <div
          className={`mb-2 flex h-14 w-14 items-center justify-center rounded-full ${config.bgClass}`}
        >
          <Icon className={`h-7 w-7 ${config.iconClass}`} />
        </div>
        <CardTitle>{config.title}</CardTitle>
        <p className="text-sm text-muted-foreground">{config.description}</p>
      </CardHeader>

      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-col gap-2 rounded-lg bg-muted/50 p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Amount sent</span>
            <span className="font-medium text-foreground">
              {source.amount} {source.currency}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Amount received</span>
            <span className="font-medium text-foreground">
              {destination.amount} {destination.currency}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Recipient</span>
            <span className="font-medium text-foreground">{recipientName}</span>
          </div>
        </div>
      </CardContent>

      {isTerminal && onDone && (
        <>
          <Separator />
          <CardFooter>
            <Button className="w-full" size="lg" onClick={onDone}>
              {status === "completed" ? "Done" : "Back to Withdraw"}
            </Button>
          </CardFooter>
        </>
      )}
    </Card>
  );
}
