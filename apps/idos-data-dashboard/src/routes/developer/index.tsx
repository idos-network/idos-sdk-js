import { useQuery } from "@tanstack/react-query";
import jwt from "jsonwebtoken";
import {
  ArrowRightIcon,
  ArrowUpRightIcon,
  CheckCircle2Icon,
  ChevronDownIcon,
  CopyIcon,
  Code2Icon,
  DatabaseIcon,
  FileCode2Icon,
  FileTextIcon,
  KeyRoundIcon,
  LockKeyholeIcon,
  RefreshCwIcon,
  RocketIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from "lucide-react";
import { useState } from "react";
import { redirect, useLoaderData } from "react-router";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { getDb } from "@/core/db.server";
import { SERVER_ENV } from "@/core/envFlags.server";
import { sessionStorage } from "@/core/sessions.server";
import { cn } from "@/lib/utils";

import type { Route } from "../+types";

import sampleSkillMd from "./skills.md?raw";
import sampleJavascriptExample from "./typescript.txt?raw";

export const handle = { breadcrumb: "Developer console" };

type ImplementationView = "skills" | "javascript";

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

const launchChecklist = [
  {
    title: "Generate production credentials",
    description:
      "Issue production relay and consumer keys, store them in your secrets manager, and rotate any playground or staging values.",
  },
  {
    title: "Configure production environment",
    description:
      "idOS offers more than this few steps, are you interested in credential reusability? facesign? more?",
  },
  {
    title: "Send a compliance brief",
    description:
      "Share how you use idOS data, retention, and issuers with your compliance or legal team before you go live.",
  },
  {
    title: "Set up and verify production",
    description:
      "Point your app at production node and relay URLs, load env vars from secure config, and verify KYC and credential flows in prod.",
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

function CodeBlock({ children }: { children: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(children);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="relative">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="absolute top-3 right-3"
        onClick={handleCopy}
      >
        {copied ? <CheckCircle2Icon className="size-4" /> : <CopyIcon className="size-4" />}
        {copied ? "Copied" : "Copy"}
      </Button>
      <pre
        className="bg-hover-subtle max-h-128 overflow-x-auto rounded-xl px-4 py-3 pr-28 text-xs whitespace-pre sm:text-sm"
        style={{
          fontFamily: "SFMono-Regular, Menlo, Monaco, Consolas, monospace",
        }}
      >
        {children}
      </pre>
    </div>
  );
}

function SecretCredentialField({ label, value }: { label: string; value: string | null }) {
  const [isVisible, setIsVisible] = useState(false);

  const handleReveal = () => {
    setIsVisible(true);

    setTimeout(() => {
      setIsVisible(false);
    }, 10000);
  };

  return (
    <div className="rounded-xl border p-4">
      <dt className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
        {label}
      </dt>
      <dd className="mt-2 flex flex-col gap-3 text-sm">
        {isVisible ? (
          <div className="flex flex-col gap-3">
            <pre
              className="bg-hover-subtle max-h-56 overflow-auto rounded-lg px-3 py-2 font-mono text-xs break-all whitespace-pre-wrap"
              style={{
                fontFamily: "SFMono-Regular, Menlo, Monaco, Consolas, monospace",
              }}
            >
              {value}
            </pre>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-fit"
              onClick={() => setIsVisible(false)}
            >
              Hide {label.toLowerCase()}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <LockKeyholeIcon className="text-muted-foreground size-4" />
              <span>Stored securely server-side</span>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="w-fit"
              aria-label={`Reveal ${label.toLowerCase()}`}
              onClick={handleReveal}
            >
              Yes I want
            </Button>
          </div>
        )}
      </dd>
    </div>
  );
}

function ImplementationPanel() {
  const { relayPrivateKey, consumerAuthKey, consumerEncKey, consumerAuthPublicKey } =
    useLoaderData<typeof loader>();
  const [view, setView] = useState<ImplementationView>("skills");
  const code = view === "skills" ? sampleSkillMd : sampleJavascriptExample;

  const replacedConstantsCode = code
    .replaceAll("REPLACE_WITH_RELAY_PRIVATE_KEY", relayPrivateKey)
    .replaceAll("REPLACE_WITH_CONSUMER_SIGNING_PRIVATE_KEY", consumerAuthKey ?? "")
    .replaceAll("REPLACE_WITH_CONSUMER_ENCRYPTION_PRIVATE_KEY", consumerEncKey ?? "")
    .replaceAll("REPLACE_WITH_CONSUMER_WALLET_IDENTIFIER", consumerAuthPublicKey ?? "")
    .replaceAll("REPLACE_WITH_ACCEPTED_ISSUER_PUBLIC_KEY", "ABCD") // RELAY
    .replaceAll("REPLACE_WITH_ACCEPTED_ISSUER_ID_OR_URL", "ABCD"); // RELAY

  return (
    <section
      id="implementation"
      className="bg-card flex scroll-mt-5 flex-col gap-5 rounded-2xl p-5 lg:p-6"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <Badge>Step 3</Badge>
            <Badge variant="outline">Implementation</Badge>
          </div>
          <h2 className="mt-3 text-xl font-semibold">Build with your generated setup</h2>
          <p className="text-muted-foreground mt-1 text-sm leading-6">
            Switch between an agent-ready <code>skills.md</code> template and a TypeScript example
            for reading idOS credentials from your app. See also the official{" "}
            <a
              href="https://github.com/idos-network/idos-sdk-js/blob/main/docs/guide-consumer.md"
              target="_blank"
              rel="noreferrer noopener"
              className="text-primary font-medium underline-offset-2 hover:underline"
            >
              Consumer guide
            </a>{" "}
            in the idOS SDK repository.
          </p>
        </div>

        <div
          role="tablist"
          aria-label="Implementation examples"
          className="bg-background flex w-full rounded-xl border p-1 sm:w-fit"
        >
          <Button
            type="button"
            role="tab"
            aria-selected={view === "skills"}
            variant={view === "skills" ? "default" : "ghost"}
            size="sm"
            className="flex-1 sm:flex-none"
            onClick={() => setView("skills")}
          >
            <FileTextIcon className="size-4" />
            AI TypeScript integration
          </Button>
          <Button
            type="button"
            role="tab"
            aria-selected={view === "javascript"}
            variant={view === "javascript" ? "default" : "ghost"}
            size="sm"
            className="flex-1 sm:flex-none"
            onClick={() => setView("javascript")}
          >
            <FileCode2Icon className="size-4" />
            TypeScript example
          </Button>
        </div>
      </div>

      <CodeBlock>{replacedConstantsCode}</CodeBlock>
    </section>
  );
}

function CredentialMeta({ credential }: { credential: Credential }) {
  return (
    <li className="flex items-center gap-3 rounded-xl border p-4">
      <div className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-lg">
        <DatabaseIcon className="size-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{credential.id}</p>
        <p className="text-muted-foreground truncate text-sm">{credential.level}</p>
        <p className="text-muted-foreground truncate text-sm">
          {credential.firstName} {credential.lastName}
        </p>
      </div>
      <Badge variant="success" className="capitalize">
        Available
      </Badge>
    </li>
  );
}

export interface Credential {
  id: string;
  level: string;
  firstName: string;
  lastName: string;
}

function CredentialAccessSection() {
  const {
    data: credentials,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["developer", "access-grants"],
    queryFn: async (): Promise<Credential[]> => {
      const res = await fetch("/api/developer-credentials");
      if (!res.ok) {
        throw new Error("Failed to load grants");
      }
      return res.json().then((data) => data.credentials) as Promise<Credential[]>;
    },
    initialData: [],
    refetchInterval: 5000,
  });

  return (
    <section
      id="credential-access"
      className="bg-card flex scroll-mt-5 flex-col gap-5 rounded-2xl p-5 lg:p-6"
    >
      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">Step 4</Badge>
          <Badge variant="outline">Credential access</Badge>
        </div>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-semibold">Credentials shared with this app</h2>
            <p className="text-muted-foreground mt-1 text-sm leading-6">
              Preview the credentials your app can request, decrypt, and share after a user
              completes a journey. Refreshes automatically every few seconds.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0 gap-2 self-start sm:self-auto"
            onClick={() => void refetch()}
            disabled={isFetching}
            aria-busy={isFetching}
          >
            <RefreshCwIcon className={cn("size-4", isFetching && "animate-spin")} aria-hidden />
            Refresh
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {credentials.length > 0 ? (
          <ul className="flex flex-col gap-3">
            {credentials.map((credential) => (
              <CredentialMeta key={credential.id} credential={credential} />
            ))}
          </ul>
        ) : (
          <div className="border-border bg-background flex flex-col items-center gap-2 rounded-xl border border-dashed p-6 text-center">
            <DatabaseIcon className="text-muted-foreground size-8" />
            <h3 className="font-semibold">No credentials yet</h3>
            <p className="text-muted-foreground max-w-md text-sm leading-6">
              Completed KYC journeys will appear here once credentials are issued to this wallet.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function LaunchChecklist() {
  return (
    <section
      id="go-live"
      className="bg-card flex scroll-mt-5 flex-col gap-5 rounded-2xl p-5 lg:p-6"
    >
      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">Step 5</Badge>
          <Badge variant="outline">Compliance & Go live</Badge>
        </div>
        <h2 className="mt-3 text-xl font-semibold">Prepare for production access</h2>
        <p className="text-muted-foreground text-sm leading-6">
          Use this final checklist once implementation and credential access are working in the
          sandbox.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-1">
        {launchChecklist.map((item) => (
          <article key={item.title} className="rounded-xl border p-4">
            <div className="flex gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-green-500/20 bg-green-500/10 text-green-700 dark:text-green-300">
                <ArrowRightIcon className="size-5" />
              </div>
              <div>
                <h3 className="font-semibold">{item.title}</h3>
                <p className="text-muted-foreground mt-1 text-sm leading-6">{item.description}</p>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="bg-background flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-semibold">Ready for review?</h3>
          <p className="text-muted-foreground mt-1 text-sm leading-6">
            Collect your client ID, journey test results, and credential access requirements before
            requesting production credentials.
          </p>
        </div>
        <Button variant="secondary" className="w-full sm:w-fit">
          Request production access
          <RocketIcon className="size-4" />
        </Button>
      </div>
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
  const {
    basicLiveness,
    plusLiveness,
    relayClientId,
    consumerAuthPublicKey,
    consumerAuthKey,
    relayName,
    consumerEncKey,
    relayPrivateKey,
  } = useLoaderData<typeof loader>();

  const livenessLinks = [
    {
      title: "Basic Liveness",
      description: "Proof of identity and liveness.",
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

        <article
          id="project-credentials"
          className="bg-card flex scroll-mt-5 flex-col gap-5 rounded-2xl p-5 lg:p-6"
        >
          <Collapsible className="flex flex-col gap-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="success">Step 1</Badge>
                  <Badge variant="outline">Generated</Badge>
                </div>
                <h2 className="mt-3 text-xl font-semibold">Project credentials</h2>
                <p className="text-muted-foreground mt-1 text-sm leading-6">
                  Use the relay client ID in your integration. The signing key stays server-side and
                  is used here to generate journey links.
                </p>
              </div>
              <CollapsibleTrigger
                className={cn(
                  buttonVariants({ variant: "secondary", size: "sm" }),
                  "group w-full sm:w-fit",
                )}
              >
                Credentials
                <ChevronDownIcon className="size-4 transition-transform group-aria-expanded:rotate-180" />
              </CollapsibleTrigger>
            </div>

            <CollapsibleContent>
              <dl className="flex flex-col gap-3">
                <div className="rounded-xl border p-4">
                  <dt className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                    Relay client ID
                  </dt>
                  <dd className="mt-2 font-mono text-sm break-all">{relayClientId}</dd>
                </div>
                <div className="rounded-xl border p-4">
                  <dt className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                    Relay client name
                  </dt>
                  <dd className="mt-2 font-mono text-sm break-all">{relayName}</dd>
                </div>
                <div className="rounded-xl border p-4">
                  <dt className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                    Consumer auth key
                  </dt>
                  <dd className="mt-2 font-mono text-sm break-all">{consumerAuthPublicKey}</dd>
                </div>
                <SecretCredentialField label="Signing key" value={relayPrivateKey} />
                <SecretCredentialField label="Consumer signing key" value={consumerAuthKey} />
                <SecretCredentialField label="Consumer encryption key" value={consumerEncKey} />
              </dl>
            </CollapsibleContent>
          </Collapsible>
        </article>

        <article
          id="kyc-journeys"
          className="bg-card flex scroll-mt-5 flex-col gap-5 rounded-2xl p-5 lg:p-6"
        >
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="success">Step 2</Badge>
              <Badge variant="outline">KYC journeys</Badge>
            </div>
            <h2 className="mt-3 text-xl font-semibold">Test verification journeys</h2>
            <p className="text-muted-foreground mt-1 text-sm leading-6">
              Launch either journey in a new tab to issue sample credentials against this setup.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
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
                      "group h-auto min-h-36 justify-start rounded-2xl border bg-linear-to-br p-0 text-left shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-xl",
                  }),
                  className,
                )}
              >
                <div className="flex w-full flex-col gap-5 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="bg-background/70 text-primary flex size-12 items-center justify-center rounded-2xl border backdrop-blur">
                      <Icon className="size-6" />
                    </div>
                    <ArrowUpRightIcon className="text-muted-foreground size-5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">{title}</h3>
                    <p className="text-muted-foreground text-sm leading-6">{description}</p>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </article>

        <ImplementationPanel />

        <CredentialAccessSection />

        <LaunchChecklist />
      </div>
    </div>
  );
}
