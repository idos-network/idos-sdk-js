import { ArrowDown, Clock, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
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

interface QuoteDisplayProps {
  source: { currency: string; amount: string; fee: string };
  destination: { currency: string; amount: string; fee: string };
  fxRate: number;
  expiresAt: string;
  onConfirm: () => void;
  onCancel: () => void;
  onRefresh?: () => void;
  isLoading?: boolean;
}

function useCountdown(expiresAt: string) {
  const [secondsLeft, setSecondsLeft] = useState(() => {
    const diff = Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000);
    return Math.max(0, diff);
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const diff = Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000);
      setSecondsLeft(Math.max(0, diff));
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  return secondsLeft;
}

export function QuoteDisplay({
  source,
  destination,
  fxRate,
  expiresAt,
  onConfirm,
  onCancel,
  onRefresh,
  isLoading = false,
}: QuoteDisplayProps) {
  const secondsLeft = useCountdown(expiresAt);
  const expired = secondsLeft <= 0;
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  return (
    <Card className="mx-auto max-w-2xl shadow-sm gap-5">
      <CardHeader>
        <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-info/10 text-info-foreground">
          <RefreshCw className="h-6 w-6" />
        </div>
        <CardTitle>Transfer Summary</CardTitle>
        <CardDescription>Review the details before confirming</CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 rounded-lg bg-muted/50 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">You send</span>
            <span className="text-lg font-semibold text-foreground">
              {source.amount} {source.currency}
            </span>
          </div>

          {Number(source.fee) > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Source fee</span>
              <span className="text-sm text-muted-foreground">
                -{source.fee} {source.currency}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-center">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
            <ArrowDown className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-lg bg-muted/50 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Recipient gets</span>
            <span className="text-lg font-semibold text-foreground">
              {destination.amount} {destination.currency}
            </span>
          </div>

          {Number(destination.fee) > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Destination fee</span>
              <span className="text-sm text-muted-foreground">
                -{destination.fee} {destination.currency}
              </span>
            </div>
          )}
        </div>

        <Separator />

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Exchange rate</span>
            <span className="font-medium text-foreground">
              1 {source.currency} = {fxRate} {destination.currency}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total fees</span>
            <span className="font-medium text-foreground">
              {source.fee} {source.currency}
              {Number(destination.fee) > 0 && ` + ${destination.fee} ${destination.currency}`}
            </span>
          </div>
        </div>

        <div
          className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
            expired
              ? "bg-destructive/10 text-destructive"
              : secondsLeft <= 30
                ? "bg-warning/10 text-warning-foreground"
                : "bg-muted text-muted-foreground"
          }`}
        >
          <Clock className="h-4 w-4" />
          <span>
            {expired
              ? "Quote expired"
              : `Quote expires in ${minutes}:${seconds.toString().padStart(2, "0")}`}
          </span>
        </div>
      </CardContent>

      <Separator />

      <CardFooter className="flex flex-col gap-3">
        {expired && onRefresh ? (
          <Button className="w-full" size="lg" variant="outline" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4" />
            Refresh Quote
          </Button>
        ) : (
          <Button className="w-full" size="lg" disabled={expired || isLoading} onClick={onConfirm}>
            {isLoading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Processing...
              </>
            ) : (
              "Confirm Transfer"
            )}
          </Button>
        )}
        <Button
          variant="ghost"
          size="lg"
          className="w-full"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
      </CardFooter>
    </Card>
  );
}
