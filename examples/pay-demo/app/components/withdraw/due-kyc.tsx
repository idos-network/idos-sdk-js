import { ScanFace } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";

interface DueKycProps {
  kycUrl: string;
}

export function DueKyc({ kycUrl }: DueKycProps) {
  return (
    <Card className="mx-auto max-w-4xl overflow-hidden shadow-sm">
      <CardHeader>
        <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-warning/10 text-warning-foreground">
          <ScanFace className="h-6 w-6" />
        </div>
        <CardTitle>Identity Verification</CardTitle>
        <CardDescription>Complete your verification through Due</CardDescription>
      </CardHeader>

      <CardContent className="p-0">
        <iframe
          src={kycUrl}
          title="Due KYC"
          className="h-[70dvh] w-full border-none"
          allow="camera;microphone"
          sandbox="allow-popups allow-forms allow-scripts allow-same-origin"
        />
      </CardContent>
    </Card>
  );
}
