import { redirect } from "react-router";

import { sessionStorage } from "@/core/sessions.server";

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
    return redirect("/developer/onboarding");
  }

  return null;
}

export default function Developer() {
  return (
    <div className="flex flex-1 flex-col items-stretch gap-5">
      <div className="bg-card flex h-14 items-center justify-between rounded-xl p-5 lg:h-20">
        <h1 className="block text-2xl font-bold lg:text-3xl">Developer console</h1>
      </div>

      <Schema />
    </div>
  );
}
