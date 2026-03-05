import { ScanFace } from "lucide-react";

interface DueKycProps {
  kycUrl: string;
}

export function DueKyc({ kycUrl }: DueKycProps) {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4">
      <div className="flex flex-col items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning/10 text-warning-foreground">
          <ScanFace className="h-5 w-5" />
        </div>
        <h3 className="font-semibold text-foreground text-lg leading-none">
          Identity Verification
        </h3>
      </div>

      <iframe
        src={kycUrl}
        title="Due KYC"
        className="h-[70dvh] w-full rounded-2xl"
        allow="camera;microphone"
        sandbox="allow-popups allow-forms allow-scripts allow-same-origin"
      />
    </div>
  );
}
