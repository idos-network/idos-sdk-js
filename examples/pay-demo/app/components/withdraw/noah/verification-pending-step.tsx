import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useStepper } from "./stepper-config";

type VerificationStatus = "pending" | "approved" | "declined";

export function VerificationPendingStep() {
  const [status] = useState<VerificationStatus>("pending");
  const stepper = useStepper();

  useEffect(() => {
    // TODO: Implement polling for Noah verification status
    // This should poll the Noah status API endpoint
    // For now, we'll simulate a pending state

    const interval = setInterval(async () => {
      try {
        console.log("Checking verification status...");
        // In real implementation, fetch from /app/noah/status or similar
        // const response = await fetch('/app/noah/status');
        // const data = await response.json();
        // if (data.status === 'approved') {
        //   setStatus('approved');
        //   setTimeout(() => stepper.goTo('transaction-pending'), 3000);
        // } else if (data.status === 'declined') {
        //   setStatus('declined');
        // }
      } catch (error) {
        console.error("Error checking verification status:", error);
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [stepper]);

  useEffect(() => {
    if (status === "approved") {
      setTimeout(() => {
        stepper.goTo("transaction-pending");
      }, 3000);
    }
  }, [status, stepper]);

  if (status === "approved") {
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-4 p-6 text-center">
        <CheckCircle2 className="size-12 text-green-500" />
        <div>
          <h3 className="font-medium text-green-500 text-lg">Verification Approved</h3>
          <p className="mt-1 text-muted-foreground text-sm">
            Your Noah verification is approved. You can now use Noah's payment services.
          </p>
        </div>
      </div>
    );
  }

  if (status === "declined") {
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-4 p-6 text-center">
        <XCircle className="size-12 text-red-500" />
        <div>
          <h3 className="font-medium text-lg text-red-500">Verification Declined</h3>
          <p className="mt-1 text-muted-foreground text-sm">
            Unfortunately, your Noah verification was declined. Please contact support for more
            information.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="relative">
        <Clock className="size-12 text-yellow-500" />
      </div>
      <div>
        <h3 className="font-medium text-lg text-yellow-500">Verification Pending</h3>
        <p className="mt-1 text-muted-foreground text-sm">
          Your Noah verification is being processed. This usually takes a few minutes.
        </p>
      </div>
      <div className="mt-2 rounded-lg bg-yellow-500/10 px-4 py-2">
        <p className="text-xs text-yellow-500">
          We'll automatically continue when your status is approved
        </p>
      </div>
    </div>
  );
}
