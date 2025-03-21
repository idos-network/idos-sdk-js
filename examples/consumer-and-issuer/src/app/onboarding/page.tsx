import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cookieToInitialState } from "wagmi";

import { Onboarding } from "@/components/onboarding";
import { IsleProvider } from "@/isle.provider";
import { getConfig } from "@/wagmi.config";

export default async function OnboardingPage() {
  const initialState = cookieToInitialState(getConfig(), (await headers()).get("cookie"));

  if (!initialState?.connections.size || initialState.connections.size === 0) {
    redirect("/");
  }

  return (
    <div className="container mx-auto p-6 px-3">
      <IsleProvider containerId="idOS-isle">
        <Onboarding />
      </IsleProvider>
    </div>
  );
}
