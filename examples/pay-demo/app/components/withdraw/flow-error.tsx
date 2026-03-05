import { AlertCircle } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardFooter } from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";

interface FlowErrorProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function FlowError({ title = "Something went wrong", message, onRetry }: FlowErrorProps) {
  return (
    <Card className="mx-auto max-w-2xl shadow-sm">
      <CardContent className="flex flex-col items-center gap-3 pt-8 pb-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
          <AlertCircle className="h-7 w-7 text-destructive" />
        </div>
        <h3 className="font-semibold text-foreground text-lg">{title}</h3>
        {message && <p className="max-w-sm text-muted-foreground text-sm">{message}</p>}
      </CardContent>

      {onRetry && (
        <>
          <Separator />
          <CardFooter>
            <Button className="w-full" size="lg" variant="outline" onClick={onRetry}>
              Try Again
            </Button>
          </CardFooter>
        </>
      )}
    </Card>
  );
}
