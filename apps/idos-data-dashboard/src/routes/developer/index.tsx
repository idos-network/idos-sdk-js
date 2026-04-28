import jwt from "jsonwebtoken";
import { ArrowUpRightIcon, ShieldCheckIcon, SparklesIcon } from "lucide-react";
import { redirect, useLoaderData } from "react-router";

import { buttonVariants } from "@/components/ui/button";
import { getDb } from "@/core/db.server";
import { SERVER_ENV } from "@/core/envFlags.server";
import { sessionStorage } from "@/core/sessions.server";
import { cn } from "@/lib/utils";

import type { Route } from "../+types";

export const handle = { breadcrumb: "Developer console" };

const sampleSkillMd = [
  "---",
  "name: idos-integration-assistant",
  "description: Help developers integrate the idOS SDK, debug wallet/auth/credential issues, and suggest the safest next step. Use when the user asks about idOS integration, SDK setup, wallet connections, credential flows, or troubleshooting.",
  "---",
  "",
  "# idOS Integration Assistant",
  "",
  "## Quick start",
  "Use this skill when a developer needs help setting up the idOS SDK or debugging an integration issue.",
  "",
  "1. Confirm the developer's goal and the exact failing action.",
  "2. Classify the issue as setup, wallet, API, or app state.",
  "3. Recommend the smallest safe next step first.",
  "4. Explain why that step matters in one short sentence.",
  "5. If the issue persists, return an escalation summary with evidence.",
  "",
  "## Inputs to collect",
  "- SDK version",
  "- Framework or runtime",
  "- Wallet provider",
  "- Network or environment",
  "- Error message and reproduction steps",
  "",
  "## Guardrails",
  "- Never ask for seed phrases, private keys, or production secrets.",
  "- Do not invent SDK methods, routes, or environment variables.",
  "- Prefer copy-pasteable examples over abstract advice.",
  "- Call out assumptions when the logs are incomplete.",
  "",
  "## Response format",
  "- Summary",
  "- Likely cause",
  "- Recommended next step",
  "- Optional code sample",
  "",
  "## Example",
  "```markdown",
  "Summary: The wallet connects, but the SDK client never finishes initialization.",
  "Likely cause: The app is creating the client before the wallet session is fully available.",
  "Recommended next step: Move client creation behind the wallet-ready check and log the first initialization error.",
  "Optional code sample: Show a minimal client setup inside the wallet connection success path.",
  "```",
  "",
  "## Additional resources",
  "- Add links to docs, runbooks, or example repos here when you have them.",
].join("\n");

function Schema() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
      <section className="bg-card flex flex-col gap-3 rounded-xl p-5">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-semibold">Starter template</h2>
          <p className="text-muted-foreground text-sm font-medium">
            Here is a sample <code>skills.md</code> file you can use for an AI agent.
          </p>
        </div>
        <p className="text-muted-foreground text-sm">
          Use this as a starting point for an agent that helps developers integrate and debug idOS.
          Swap in your own domain, tools, and response format as needed.
        </p>
      </section>
      <section className="bg-card rounded-xl p-5">
        <pre
          className="bg-hover-subtle overflow-x-auto rounded-lg px-4 py-3 text-xs whitespace-pre sm:text-sm"
          style={{
            fontFamily: "SFMono-Regular, Menlo, Monaco, Consolas, monospace",
          }}
        >
          {sampleSkillMd}
        </pre>
      </section>
    </div>
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
  };
}

export default function Developer() {
  const { basicLiveness, plusLiveness } = useLoaderData<typeof loader>();
  const livenessLinks = [
    {
      title: "Basic Liveness",
      description: "Proof of identity with liveness check.",
      href: basicLiveness,
      icon: ShieldCheckIcon,
      className:
        "from-primary/20 via-primary/10 to-background hover:border-primary/40 hover:shadow-primary/10",
    },
    {
      title: "Plus Liveness",
      description: "Basic and proof of residency.",
      href: plusLiveness,
      icon: SparklesIcon,
      className:
        "from-violet-500/20 via-fuchsia-500/10 to-background hover:border-violet-400/40 hover:shadow-violet-500/10",
    },
  ] as const;

  return (
    <div className="flex flex-1 flex-col items-stretch gap-5">
      <div className="bg-card flex h-14 items-center justify-between rounded-xl p-5 lg:h-20">
        <h1 className="block text-2xl font-bold lg:text-3xl">Developer console</h1>
      </div>

      <div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
        <section className="max-w- bg-card mx-auto flex w-full flex-col gap-3 rounded-xl p-5">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-semibold">Starter template</h2>
            <p className="text-muted-foreground text-sm font-medium">
              Here is a sample <code>skills.md</code> file you can use for an AI agent.
            </p>
          </div>
          <p className="text-muted-foreground text-sm">
            Use this as a starting point for an agent that helps developers integrate and debug
            idOS. Swap in your own domain, tools, and response format as needed.
          </p>
        </section>

        <section className="mx-auto grid w-full max-w-4xl gap-4 md:grid-cols-2">
          {livenessLinks.map(({ title, description, href, icon: Icon, className }) => (
            <a
              key={title}
              href={href}
              target="_blank"
              rel="noreferrer"
              className={cn(
                buttonVariants({
                  variant: "outline",
                  size: "xl",
                  className:
                    "group h-auto min-h-40 justify-start rounded-2xl border bg-linear-to-br p-0 text-left shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-xl",
                }),
                className,
              )}
            >
              <div className="flex w-full flex-col gap-6 p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="bg-background/70 text-primary flex size-14 items-center justify-center rounded-2xl border backdrop-blur">
                    <Icon className="size-7" />
                  </div>
                  <ArrowUpRightIcon className="text-muted-foreground size-5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>

                <div className="space-y-2">
                  <h2 className="text-xl font-semibold">{title}</h2>
                  <p className="text-muted-foreground text-sm leading-6">{description}</p>
                </div>
              </div>
            </a>
          ))}
        </section>
      </div>

      <Schema />
    </div>
  );
}
