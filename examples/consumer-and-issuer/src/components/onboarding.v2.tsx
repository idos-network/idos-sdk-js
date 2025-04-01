import { cn } from "@heroui/react";
import { RocketIcon, ScanEyeIcon, ShieldEllipsisIcon, ShieldIcon, User2Icon } from "lucide-react";

function StepIcon({ icon }: { icon: React.ReactNode }) {
  return (
    <div className="inline-flex h-10 w-10 shrink-0 place-content-center items-center rounded-md border border-neutral-200 bg-white text-neutral-900 drop-shadow">
      {icon}
    </div>
  );
}

function OnboardingStep({
  isActive = false,
  children,
}: { isActive?: boolean; children: React.ReactNode }) {
  return (
    <li
      className={cn(
        "flex items-center gap-4 font-semibold text-md",
        isActive ? undefined : "opacity-30",
      )}
    >
      {children}
    </li>
  );
}

function CreateProfileStepDescription() {
  return (
    <div className="flex flex-col gap-3">
      <h1 className="font-bold text-4xl">Create an idOS profile</h1>
      <p className="text-lg text-neutral-500">
        You will be prompted to create an idOS key. Afterwards, we will create an idOS profile for
        you. Please, follow the prompts to complete the process.
      </p>
    </div>
  );
}

function IdentityVerificationStepDescription() {
  return (
    <div className="flex flex-col gap-3">
      <ShieldIcon className="h-12 w-12 stroke-1" />
      <h1 className="font-bold text-4xl">Identity verification</h1>
      <p className="text-lg text-neutral-500">
        We need to verify your identity. This is a mandatory step to continue. Please have your ID
        ready.
      </p>
    </div>
  );
}

function IdentityVerificationInProgressStepDescription() {
  return (
    <div className="flex flex-col gap-3">
      <ShieldEllipsisIcon className="h-12 w-12 stroke-1" />
      <h1 className="font-bold text-4xl">Pending verification</h1>
      <p className="text-lg text-neutral-500">
        Your data is being processed. Please be patient. It will take a few minutes.
      </p>
    </div>
  );
}

function PermissionsStepDescription() {
  return (
    <div className="flex flex-col gap-3">
      <ScanEyeIcon className="h-12 w-12 stroke-1" />
      <h1 className="font-bold text-4xl">Permissions</h1>
      <p className="text-lg text-neutral-500">
        Please grant the necessary permissions so NeoBank can issue a credential to your idOS
        profile.
      </p>
    </div>
  );
}

function ClaimCardStepDescription() {
  return (
    <div className="flex flex-col gap-3">
      <img src="/static/logo.svg" alt="NeoBank" width={12} height={12} />

      <h1 className="font-bold text-4xl">Welcome to NeoBank!</h1>
      <p className="text-lg text-neutral-500">
        You can now claim your exclusive high-limit credit card and start your premium banking
        journey.
      </p>
    </div>
  );
}

type OnboardingStatus = "create-profile" | "identity-verification" | "permissions" | "claim-card";

export function Onboarding() {
  return (
    <div className="container relative mx-auto h-dvh p-6">
      <div className="flex h-full max-w-screen-lg flex-col gap-8 lg:gap-12">
        <div className="flex flex-col">
          <ul className="flex flex-col gap-6 rounded-xl border border-neutral-100 bg-neutral-50 p-2.5 lg:flex-row lg:items-center">
            <OnboardingStep isActive>
              <StepIcon icon={<User2Icon />} />
              <p>Create an idOS profile</p>
            </OnboardingStep>
            <OnboardingStep>
              <StepIcon icon={<ShieldIcon />} />
              <p>Identity verification</p>
            </OnboardingStep>
            <OnboardingStep>
              <StepIcon icon={<ScanEyeIcon />} />
              <p>Permissions</p>
            </OnboardingStep>
            <OnboardingStep>
              <StepIcon icon={<RocketIcon />} />
              <p>Claim your ACME Bank card!</p>
            </OnboardingStep>
          </ul>
        </div>
        <div className="flex h-full flex-col gap-6">
          <div className="max-w-2xl">
            <CreateProfileStepDescription />
          </div>
        </div>
      </div>
    </div>
  );
}
