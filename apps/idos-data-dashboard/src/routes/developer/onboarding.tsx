import {
  ArrowRightIcon,
  CheckIcon,
  ExternalLinkIcon,
  KeyRoundIcon,
  LogInIcon,
  RocketIcon,
  SparklesIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useLoaderData, useNavigate } from "react-router";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { sessionStorage } from "@/core/sessions.server";
import { cn } from "@/lib/utils";
import { useSelector as useDashboardSelector } from "@/machines/dashboard/provider";
import { selectLoggedInClient } from "@/machines/dashboard/selectors";
import {
  MachineProvider,
  selectActiveStep,
  useActorRef,
  useSelector,
} from "@/machines/developer/provider";

import type { Route } from "../+types";

export const handle = { breadcrumb: "Developer console" };

const setupSteps = [
  {
    id: "sign-in",
    title: "Sign in to developer console",
    description: "Sign in to the developer console to continue.",
    detail: "Signing in to the developer console",
    icon: LogInIcon,
  },
  {
    id: "terms-and-conditions",
    title: "Accept Terms & Conditions",
    description: "Read and accept the Terms & Conditions of the service to proceed.",
    detail: "T&C accepted",
    icon: CheckIcon,
  },
  {
    id: "generate-keys",
    title: "Generate keys",
    description:
      "Create the API key pair and stage it for the project so the console can talk to the sandbox right away.",
    detail: "Public and secret keys issued",
    icon: KeyRoundIcon,
  },
  {
    id: "create-journeys",
    title: "Create journeys",
    description:
      "Provision starter journeys and demo-friendly defaults so the first walkthrough already feels alive.",
    detail: "Starter journeys created",
    icon: RocketIcon,
  },
  {
    id: "done",
    title: "Done",
    description: "Wrap everything up and leave the environment ready for the next click.",
    detail: "Developer workspace ready",
    icon: SparklesIcon,
  },
] as const;

const TERMS_AND_CONDITIONS_URL = "https://www.idos.network/legal/user-agreement";

type StepStatus = "complete" | "current" | "upcoming";

function getStepStatus(index: number, activeStep: number): StepStatus {
  if (activeStep > index) return "complete";
  if (activeStep === index) return "current";
  return "upcoming";
}

function SetupStepCard({
  activeStep,
  index,
  step,
}: {
  activeStep: number;
  index: number;
  step: (typeof setupSteps)[number];
}) {
  const actorRef = useActorRef();
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isAcceptingTerms, setIsAcceptingTerms] = useState(false);
  const status = getStepStatus(index, activeStep);
  const isComplete = status === "complete";
  const isCurrent = status === "current";
  const Icon = step.icon;
  const isTermsAndConditionsStep = step.id === "terms-and-conditions";

  const handleAcceptTerms = () => {
    setIsAcceptingTerms(true);
    actorRef.send({ type: "acceptTermsAndConditions" });
  };

  const isRequestingTermsAcceptance = useSelector((snapshot) =>
    snapshot.matches({ termsAndConditions: "showTermsAndConditions" }),
  );

  return (
    <li
      className={cn(
        "rounded-2xl border p-5 transition-all duration-300",
        isCurrent && "border-primary/30 bg-primary/5 shadow-sm",
        isComplete && "border-green-500/25 bg-green-500/5",
        status === "upcoming" && "border-border/60 bg-card",
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div
          className={cn(
            "flex size-12 shrink-0 items-center justify-center rounded-xl border",
            isCurrent && "border-primary/30 bg-primary/10 text-primary",
            isComplete && "border-green-500/20 bg-green-500/10 text-green-700 dark:text-green-300",
            status === "upcoming" && "border-border bg-background text-muted-foreground",
          )}
        >
          <Icon className={cn("size-5", isCurrent && "animate-pulse")} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-muted-foreground text-[0.7rem] font-semibold tracking-[0.22em] uppercase">
              Step {String(index + 1).padStart(2, "0")}
            </span>
            <Badge variant={isComplete ? "success" : isCurrent ? "warning" : "outline"}>
              {isComplete ? "Complete" : isCurrent ? "In progress" : "Queued"}
            </Badge>
          </div>

          <h2 className="mt-3 text-lg font-semibold">{step.title}</h2>
          <p className="text-muted-foreground mt-1 text-sm leading-6">{step.description}</p>

          {isTermsAndConditionsStep && isRequestingTermsAcceptance ? (
            <div className="mt-4 flex flex-col items-start gap-3">
              <label className="flex items-start gap-3 text-sm">
                <input
                  checked={termsAccepted}
                  className="border-input text-primary focus-visible:ring-ring/50 mt-0.5 size-4 rounded accent-current focus-visible:ring-3 focus-visible:outline-none"
                  disabled={isAcceptingTerms}
                  onChange={(event) => setTermsAccepted(event.target.checked)}
                  type="checkbox"
                />
                <span className="text-muted-foreground leading-6">
                  I have read and accept the{" "}
                  <a
                    className="text-primary inline-flex items-center gap-1 font-medium hover:underline hover:underline-offset-4"
                    href={TERMS_AND_CONDITIONS_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Terms & Conditions
                    <ExternalLinkIcon className="size-3.5" />
                  </a>
                  .
                </span>
              </label>

              <Button
                disabled={!termsAccepted || isAcceptingTerms}
                isLoading={isAcceptingTerms}
                onClick={handleAcceptTerms}
                type="button"
              >
                Accept Terms & Conditions
              </Button>
            </div>
          ) : (
            <div className="mt-4 flex items-center gap-2 text-sm font-medium">
              {isCurrent ? (
                <>
                  <Spinner className="size-4" />
                  <span>{step.detail}</span>
                </>
              ) : isComplete ? (
                <>
                  <CheckIcon className="size-4 text-green-600 dark:text-green-300" />
                  <span>{step.detail}</span>
                </>
              ) : (
                <>
                  <ArrowRightIcon className="text-muted-foreground size-4" />
                  <span className="text-muted-foreground">Starts automatically</span>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </li>
  );
}

export async function loader({ request }: Route.LoaderArgs) {
  const session = await sessionStorage.getSession(request.headers.get("Cookie"));
  const userId = session.get("userId");

  return {
    userId,
  };
}

function DeveloperOnboardingContent({ userId }: { userId: string | null }) {
  const actorRef = useActorRef();
  const activeStep = useSelector(selectActiveStep);
  const idOSClient = useDashboardSelector(selectLoggedInClient);
  const state = useSelector((s) => s.value);
  const navigate = useNavigate();

  console.log(state);
  console.log(actorRef.getSnapshot().context);

  useEffect(() => {
    actorRef.send({ type: "init", idOSClient });
  }, [actorRef, idOSClient, userId]);

  useEffect(() => {
    if (state === "done") {
      setTimeout(() => {
        navigate("/developer");
      }, 2000);
    }
  }, [navigate, state]);

  return (
    <div className="flex flex-1 flex-col items-stretch gap-5">
      <div className="bg-card flex h-14 items-center justify-between rounded-xl p-5 lg:h-20">
        <h1 className="block text-2xl font-bold lg:text-3xl">Developer console</h1>
      </div>

      <div className="mx-auto grid w-full max-w-4xl">
        <div className="flex min-w-0 flex-col gap-5">
          <section className="bg-card rounded-2xl p-5 lg:p-6">
            <div className="flex flex-col gap-1">
              <h2 className="text-xl font-semibold">Welcome to the developer console</h2>
              <p className="text-muted-foreground text-sm">
                This will guide you through the process of setting up your developer console. You
                will need to have a wallet connected to the dashboard to continue. If you pass this
                onboarding before, you will be asked just to login again.
              </p>
            </div>

            <ol className="mt-5 flex flex-col gap-4">
              {setupSteps.map((step, index) => (
                <SetupStepCard key={step.id} activeStep={activeStep} index={index} step={step} />
              ))}
            </ol>
          </section>
        </div>
      </div>
    </div>
  );
}

export default function Developer() {
  const { userId } = useLoaderData<typeof loader>();

  return (
    <MachineProvider>
      <DeveloperOnboardingContent userId={userId ?? null} />
    </MachineProvider>
  );
}
