import { CheckCircle2Icon, CopyIcon, FileCode2Icon, FileTextIcon } from "lucide-react";
import { useState } from "react";
import { useLoaderData } from "react-router";

import type { loader } from "@/routes/developer";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import sampleSkillMd from "./files/skills.md?raw";
import sampleJavascriptExample from "./files/typescript.txt?raw";

type ImplementationView = "skills" | "javascript";

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

export function ImplementationPanel() {
  const { relayPrivateKey, consumerAuthKey, consumerEncKey, consumerAuthPublicKey } =
    useLoaderData<typeof loader>();
  const [view, setView] = useState<ImplementationView>("skills");
  const code = view === "skills" ? sampleSkillMd : sampleJavascriptExample;

  const replacedConstantsCode = code
    .replaceAll("REPLACE_WITH_RELAY_PRIVATE_KEY", relayPrivateKey)
    .replaceAll("REPLACE_WITH_CONSUMER_SIGNING_PRIVATE_KEY", consumerAuthKey ?? "")
    .replaceAll("REPLACE_WITH_CONSUMER_ENCRYPTION_PRIVATE_KEY", consumerEncKey ?? "")
    .replaceAll("REPLACE_WITH_CONSUMER_WALLET_IDENTIFIER", consumerAuthPublicKey ?? "")
    .replaceAll(
      "REPLACE_WITH_ACCEPTED_ISSUER_PUBLIC_KEY",
      "z6MkvQ4eATYjPHHXtQq44g4vKGknyDg3R3DPRqDGmhPta6Km",
    ) // RELAY
    .replaceAll(
      "REPLACE_WITH_ACCEPTED_ISSUER_ID",
      "0f2dba1284b7ab912095c241a44138b3c3492dcf5f688472b1e36875729edbef",
    ); // RELAY

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
