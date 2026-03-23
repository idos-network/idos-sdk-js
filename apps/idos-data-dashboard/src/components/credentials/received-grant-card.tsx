import type { idOSGrant } from "@idos-network/kwil-infra/actions";

import { EyeIcon, Share2Icon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useFetchSharedCredentialPublicNotes } from "@/lib/queries/credentials";
import { timelockToMs } from "@/lib/time";

import { safeParse } from "./shared";

const statusVariantMap: Record<string, "success" | "warning" | "destructive" | "default"> = {
  approved: "success",
  active: "success",
  valid: "success",
  pending: "warning",
  expired: "destructive",
  rejected: "destructive",
  revoked: "destructive",
  invalid: "destructive",
};

function formatTimelock(lockedUntil: number): string {
  const ms = timelockToMs(lockedUntil);
  if (!lockedUntil) return "No timelock";

  return new Intl.DateTimeFormat(["ban", "id"], {
    dateStyle: "short",
    timeStyle: "short",
    hour12: true,
  }).format(new Date(ms));
}

function formatType(type: string): string {
  const typeMap: Record<string, string> = {
    kyc: "KYC",
    pop: "Proof of Personhood",
  };
  return typeMap[type.toLowerCase()] ?? type.charAt(0).toUpperCase() + type.slice(1);
}

interface ReceivedGrantCardProps {
  grant: idOSGrant;
  onViewDetails: (credentialId: string) => void;
}

export function ReceivedGrantCard({ grant, onViewDetails }: ReceivedGrantCardProps) {
  const { data: rawPublicNotes, isLoading } = useFetchSharedCredentialPublicNotes({
    credentialId: grant.data_id,
  });

  const isTimelocked = timelockToMs(+grant.locked_until) >= Date.now();

  const publicNotes = safeParse(rawPublicNotes);
  const type = typeof publicNotes.type === "string" ? formatType(publicNotes.type) : "Credential";
  const issuer = typeof publicNotes.issuer === "string" ? publicNotes.issuer : null;
  const status = typeof publicNotes.status === "string" ? publicNotes.status : null;

  const detailEntries: readonly (readonly [string, string])[] = [
    ["Grant ID", grant.id],
    ["Data ID", grant.data_id],
    ["Owner", grant.ag_owner_user_id],
    ["Time-lock", formatTimelock(+grant.locked_until)],
  ];

  return (
    <div className="bg-card flex w-full min-w-0 flex-col gap-4 rounded-xl border p-5">
      <div className="flex items-center gap-3">
        <div className="bg-primary/10 flex size-12 shrink-0 items-center justify-center rounded-lg">
          <Share2Icon size={24} className="text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          {isLoading ? (
            <div className="flex flex-col gap-1.5">
              <Skeleton className="h-5 w-32 rounded" />
              <Skeleton className="h-4 w-24 rounded" />
            </div>
          ) : (
            <>
              <p className="truncate font-semibold">{type}</p>
              {issuer && <p className="text-muted-foreground truncate text-sm">{issuer}</p>}
            </>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {status && (
            <Badge
              variant={statusVariantMap[status.toLowerCase()] ?? "default"}
              className="capitalize"
            >
              {status}
            </Badge>
          )}
          <Badge variant="success" className="capitalize">
            active
          </Badge>
          {isTimelocked && (
            <Badge variant="warning" className="capitalize">
              timelocked
            </Badge>
          )}
        </div>
      </div>

      <div className="border-border bg-muted overflow-hidden rounded-lg border">
        <table className="w-full table-fixed border-collapse text-sm [&_td]:px-3 [&_td]:py-2 [&_th]:px-3 [&_th]:py-2">
          <tbody>
            {detailEntries.map(([key, value], i) => (
              <tr key={key} className={i < detailEntries.length - 1 ? "border-b" : ""}>
                <th className="text-muted-foreground w-1/3 text-left font-medium whitespace-nowrap">
                  {key}
                </th>
                <td className="max-w-0 truncate text-right" title={value}>
                  {value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button variant="secondary" onClick={() => onViewDetails(grant.data_id)}>
          <EyeIcon size={16} />
          Details
        </Button>
      </div>
    </div>
  );
}
