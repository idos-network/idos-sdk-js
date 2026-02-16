import { ArrowRight, Info, Wallet } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";

interface TransferConfirmProps {
  source: { currency: string; amount: string };
  destination: { currency: string; amount: string };
  recipientName: string;
  recipientIban: string;
  onSign: () => void;
  isLoading?: boolean;
}

function maskIban(iban: string): string {
  const clean = iban.replace(/\s/g, "");
  if (clean.length <= 8) return clean;
  return `${clean.slice(0, 4)} •••• •••• ${clean.slice(-4)}`;
}

export function TransferConfirm({
  source,
  destination,
  recipientName,
  recipientIban,
  onSign,
  isLoading = false,
}: TransferConfirmProps) {
  return (
    <Card className="mx-auto max-w-2xl shadow-sm gap-5">
      <CardHeader>
        <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-warning/10 text-warning-foreground">
          <Wallet className="h-6 w-6" />
        </div>
        <CardTitle>Confirm &amp; Sign</CardTitle>
        <CardDescription>Review the final details and sign with your wallet</CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center justify-between rounded-lg bg-muted/50 p-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Sending</span>
            <span className="text-lg font-semibold text-foreground">
              {source.amount} {source.currency}
            </span>
          </div>

          <ArrowRight className="h-5 w-5 text-muted-foreground" />

          <div className="flex flex-col items-end gap-1">
            <span className="text-xs text-muted-foreground">Receiving</span>
            <span className="text-lg font-semibold text-foreground">
              {destination.amount} {destination.currency}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Recipient</span>
            <span className="font-medium text-foreground">{recipientName}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">IBAN</span>
            <span className="font-mono text-sm text-foreground">{maskIban(recipientIban)}</span>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-lg bg-info/10 px-4 py-3">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-info-foreground" />
          <p className="text-sm text-info-foreground">
            You will be asked to sign a transaction with your wallet. This authorizes the transfer
            of funds.
          </p>
        </div>
      </CardContent>

      <Separator />

      <CardFooter>
        <Button className="w-full" size="lg" disabled={isLoading} onClick={onSign}>
          {isLoading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Signing...
            </>
          ) : (
            "Sign & Send"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
