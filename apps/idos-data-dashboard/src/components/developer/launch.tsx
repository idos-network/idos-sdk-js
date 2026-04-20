import { ArrowRightIcon, RocketIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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

export function LaunchChecklist() {
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
          <a
            href="mailto:support@idos.network"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2"
          >
            Request production access
            <RocketIcon className="size-4" />
          </a>
        </Button>
      </div>
    </section>
  );
}
