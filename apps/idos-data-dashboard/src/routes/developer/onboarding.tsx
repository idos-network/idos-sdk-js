import {
  ArrowRightIcon,
  CheckIcon,
  KeyRoundIcon,
  LogInIcon,
  RocketIcon,
  SparklesIcon,
} from "lucide-react";
import { useEffect } from "react";
import { useLoaderData, useNavigate } from "react-router";

import { Badge } from "@/components/ui/badge";
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
    title: "Sign in to developer console",
    description: "Sign in to the developer console to continue.",
    detail: "Signing in to the developer console",
    icon: LogInIcon,
  },
  {
    title: "Generate keys",
    description:
      "Create the API key pair and stage it for the project so the console can talk to the sandbox right away.",
    detail: "Public and secret keys issued",
    icon: KeyRoundIcon,
  },
  {
    title: "Create journeys",
    description:
      "Provision starter journeys and demo-friendly defaults so the first walkthrough already feels alive.",
    detail: "Starter journeys created",
    icon: RocketIcon,
  },
  {
    title: "Done",
    description: "Wrap everything up and leave the environment ready for the next click.",
    detail: "Developer workspace ready",
    icon: SparklesIcon,
  },
] as const;

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
  const status = getStepStatus(index, activeStep);
  const isComplete = status === "complete";
  const isCurrent = status === "current";
  const Icon = step.icon;

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

  useEffect(() => {
    actorRef.send({ type: "init", idOSClient });
  }, [actorRef, userId]);

  useEffect(() => {
    if (state === "done") {
      setTimeout(() => {
        navigate("/developer");
      }, 2000);
    }
  }, [state]);

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
                <SetupStepCard key={step.title} activeStep={activeStep} index={index} step={step} />
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
