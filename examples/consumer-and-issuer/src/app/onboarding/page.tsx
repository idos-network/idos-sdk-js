import { Onboarding } from "@/components/onboarding";
import { IsleProvider } from "@/isle.provider";

export default async function OnboardingPage() {
  return (
    <IsleProvider containerId="idOS-isle">
      <Onboarding />
    </IsleProvider>
  );
}
