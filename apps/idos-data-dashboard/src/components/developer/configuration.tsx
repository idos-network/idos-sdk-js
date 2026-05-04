import { ChevronDownIcon, LockKeyholeIcon } from "lucide-react";
import { useState } from "react";
import { useLoaderData } from "react-router";

import type { loader } from "@/routes/developer";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

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

export function Configuration() {
  const {
    relayClientId,
    relayName,
    consumerAuthPublicKey,
    consumerAuthKey,
    consumerEncKey,
    relayPrivateKey,
  } = useLoaderData<typeof loader>();

  return (
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
              Use the relay client ID in your integration. The signing key stays server-side and is
              used here to generate journey links.
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
  );
}
