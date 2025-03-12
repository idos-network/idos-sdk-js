import { Onboarding } from "@/components/onboarding";
import { getConfig } from "@/wagmi.config";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cookieToInitialState } from "wagmi";

export default async function OnboardingPage() {
  const initialState = cookieToInitialState(getConfig(), (await headers()).get("cookie"));

  if (!initialState?.connections.size || initialState.connections.size === 0) {
    redirect("/");
  }

  return (
    <div className="container mx-auto p-6">
      <Onboarding />
    </div>
  );
}
