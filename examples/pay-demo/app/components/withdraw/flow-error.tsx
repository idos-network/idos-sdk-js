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
        <div className="bg-destructive/10 flex h-14 w-14 items-center justify-center rounded-full">
          <AlertCircle className="text-destructive h-7 w-7" />
        </div>
        <h3 className="text-foreground text-lg font-semibold">{title}</h3>
        {message && <p className="text-muted-foreground max-w-sm text-sm">{message}</p>}
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
