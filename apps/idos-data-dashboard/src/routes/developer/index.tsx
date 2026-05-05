import jwt from "jsonwebtoken";
import { Code2Icon, DatabaseIcon, KeyRoundIcon, RocketIcon, ShieldCheckIcon } from "lucide-react";
import { redirect } from "react-router";

import { Configuration } from "@/components/developer/configuration";
import { CredentialAccessSection } from "@/components/developer/credentials";
import { ImplementationPanel } from "@/components/developer/implementation";
import { Journeys } from "@/components/developer/journeys";
import { LaunchChecklist } from "@/components/developer/launch";
import { Badge } from "@/components/ui/badge";
import { getDb } from "@/core/db.server";
import { SERVER_ENV } from "@/core/envFlags.server";
import { sessionStorage } from "@/core/sessions.server";
import { cn } from "@/lib/utils";

import type { Route } from "../+types";

export const handle = { breadcrumb: "Developer console" };

const setupSteps = [
  {
    title: "Credentials and keys",
    description: "Your Relay client and signing key were generated during onboarding.",
    status: "Generated",
    icon: KeyRoundIcon,
    href: "#project-credentials",
  },
  {
    title: "KYC journeys",
    description: "Starter verification journeys are ready to share with test users.",
    status: "Created",
    icon: ShieldCheckIcon,
    href: "#kyc-journeys",
  },
  {
    title: "Implementation",
    description: "Use the agent skill or JavaScript examples to wire idOS into your app.",
    status: "Current",
    icon: Code2Icon,
    href: "#implementation",
  },
  {
    title: "Credential access",
    description: "Review issued credentials and connect them to your product flow.",
    status: "Available",
    icon: DatabaseIcon,
    href: "#credential-access",
  },
  {
    title: "Compliance & Go live",
    description: "Confirm your integration is ready before moving beyond sandbox testing.",
    status: "Available",
    icon: RocketIcon,
    href: "#go-live",
  },
] as const;

function StepOverview() {
  return (
    <section className="grid gap-4 lg:grid-cols-5">
      {setupSteps.map((step, index) => {
        const Icon = step.icon;

        return (
          <a
            href={step.href}
            key={step.title}
            className={cn(
              "bg-card flex min-h-44 flex-col justify-between rounded-2xl border p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3",
              step.status === "Current" && "border-primary/40 bg-primary/5",
            )}
          >
            <div className="flex items-start justify-between gap-4">
              <div
                className={cn(
                  "flex size-11 items-center justify-center rounded-xl border",
                  ["Generated", "Created"].includes(step.status) &&
                    "border-green-500/25 bg-green-500/10 text-green-700 dark:text-green-300",
                  step.status === "Current" && "border-primary/30 bg-primary/10 text-primary",
                  step.status === "Available" &&
                    "border-violet-500/25 bg-violet-500/10 text-violet-700 dark:text-violet-300",
                )}
              >
                <Icon className="size-5" />
              </div>
              <span className="text-muted-foreground text-xs font-semibold">Step {index + 1}</span>
            </div>

            <div className="mt-5 flex flex-col gap-3">
              <Badge
                variant={
                  ["Generated", "Created"].includes(step.status)
                    ? "success"
                    : step.status === "Current"
                      ? "default"
                      : "outline"
                }
                className="w-fit"
              >
                {step.status}
              </Badge>
              <div>
                <h2 className="font-semibold">{step.title}</h2>
                <p className="text-muted-foreground mt-1 text-sm leading-6">{step.description}</p>
              </div>
            </div>
          </a>
        );
      })}
    </section>
  );
}

export async function loader({ request }: Route.LoaderArgs) {
  const session = await sessionStorage.getSession(request.headers.get("Cookie"));
  const userId = session.get("userId");

  if (!userId) {
    // TODO: Check if user is ready for developer console
    return redirect("/developer/onboarding");
  }

  const user = await getDb().user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user) {
    return redirect("/developer/onboarding");
  }

  if (!user.relayClientId || !user.relayPrivateKey) {
    return redirect("/developer/onboarding");
  }

  // Generate two journeys
  const basicLiveness = jwt.sign(
    {
      clientId: user.relayClientId,
      level: "basic+liveness+idos",
      kyc: true,
    },
    user.relayPrivateKey,
    { algorithm: "ES512", expiresIn: "1h" },
  );

  const plusLiveness = jwt.sign(
    {
      clientId: user.relayClientId,
      level: "plus+liveness+idos",
      kyc: true,
    },
    user.relayPrivateKey,
    { algorithm: "ES512", expiresIn: "1h" },
  );

  return {
    basicLiveness: `${SERVER_ENV.RELAY_URL}/kyc?token=${basicLiveness}`,
    plusLiveness: `${SERVER_ENV.RELAY_URL}/kyc?token=${plusLiveness}`,
    relayClientId: user.relayClientId,
    consumerAuthPublicKey: user.consumerAuthPublicKey,
    consumerAuthKey: user.consumerAuthKey,
    consumerEncPublicKey: user.consumerEncPublicKey,
    consumerEncKey: user.consumerEncKey,
    relayPrivateKey: user.relayPrivateKey,
    relayName: user.relayName,
  };
}

export default function Developer() {
  return (
    <div className="flex flex-1 flex-col items-stretch gap-5">
      <div className="bg-card flex flex-col gap-2 rounded-xl p-5 lg:p-6">
        <div className="flex flex-col gap-1 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="block text-2xl font-bold lg:text-3xl">Developer console</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Your sandbox is ready. Use this page to implement, test, and inspect credentials.
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto flex w-full flex-col gap-5">
        <StepOverview />

        <Configuration />

        <Journeys />

        <ImplementationPanel />

        <CredentialAccessSection />

        <LaunchChecklist />
      </div>
    </div>
  );
}
