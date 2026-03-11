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
        <div className="bg-success/10 flex h-14 w-14 items-center justify-center rounded-full">
          <CheckCircle2 className="text-success-foreground h-7 w-7" />
        </div>
        <h3 className="text-foreground text-lg font-semibold">{title}</h3>
        {message && <p className="text-muted-foreground max-w-sm text-sm">{message}</p>}
      </CardContent>
    </Card>
  );
}
