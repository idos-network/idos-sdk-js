import { ArrowUpRightIcon, ShieldCheckIcon, SparklesIcon } from "lucide-react";
import { useLoaderData } from "react-router";

import type { loader } from "@/routes/developer";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Journeys() {
  const { basicLiveness, plusLiveness } = useLoaderData<typeof loader>();

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
  );
}
