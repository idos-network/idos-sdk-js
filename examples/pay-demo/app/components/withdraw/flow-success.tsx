import { CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "~/components/ui/card";

interface FlowSuccessProps {
  title?: string;
  message?: string;
}

export function FlowSuccess({ title = "Success", message }: FlowSuccessProps) {
  return (
    <Card className="mx-auto max-w-2xl shadow-sm">
      <CardContent className="flex flex-col items-center gap-3 pt-8 pb-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success/10">
          <CheckCircle2 className="h-7 w-7 text-success-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        {message && <p className="max-w-sm text-sm text-muted-foreground">{message}</p>}
      </CardContent>
    </Card>
  );
}
