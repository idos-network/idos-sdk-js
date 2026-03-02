import { useEffect, useState } from "react";
import { Spinner } from "~/components/ui/spinner";

export function OnboardingStep() {
  const [onboardingUrl, setOnboardingUrl] = useState<string | null>(null);
  const [loadingMsg, setLoadingMsg] = useState<string>("Loading Noah onboarding...");

  useEffect(() => {
    // TODO: Implement onboarding URL fetch
    // This should call the Noah onboarding API endpoint
    // For now, we'll set a placeholder
    setLoadingMsg("Preparing onboarding...");

    // Simulate async onboarding URL fetch
    // In real implementation, this would call an API endpoint
    // that creates an onboarding session and returns the URL
  }, []);

  if (onboardingUrl) {
    return (
      <iframe
        src={onboardingUrl}
        width="100%"
        height="800px"
        className="self-center"
        title="Noah Onboarding"
        sandbox="allow-popups allow-forms allow-scripts allow-same-origin allow-top-navigation"
        allow="camera; microphone; clipboard-write"
      />
    );
  }

  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-4">
      <Spinner className="size-8" />
      <p className="text-muted-foreground text-sm">{loadingMsg}</p>
    </div>
  );
}
