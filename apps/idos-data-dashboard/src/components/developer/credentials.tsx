import { useQuery } from "@tanstack/react-query";
import { DatabaseIcon, RefreshCwIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface Credential {
  id: string;
  level: string;
  firstName: string;
  lastName: string;
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

export function CredentialAccessSection() {
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
