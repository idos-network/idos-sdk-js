import { EyeIcon, Share2Icon, XCircleIcon } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRevokeGrant } from "@/lib/mutations/credentials";
import { timelockToMs } from "@/lib/time";

import type { SharedGrant } from "./types";

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

const MAX_REPRESENTABLE_TIMELOCK = 8.64e12;

function formatTimelock(lockedUntil: number): string {
  if (!lockedUntil) return "No timelock";
  if (!Number.isFinite(lockedUntil) || lockedUntil > MAX_REPRESENTABLE_TIMELOCK) {
    return "Permanently locked";
  }

  const ms = timelockToMs(lockedUntil);
  const date = new Date(ms);

  if (Number.isNaN(date.getTime())) return "Permanently locked";

  return new Intl.DateTimeFormat(["ban", "id"], {
    dateStyle: "short",
    timeStyle: "short",
    hour12: true,
  }).format(date);
}

function formatType(type: string): string {
  const typeMap: Record<string, string> = {
    kyc: "KYC",
    pop: "Proof of Personhood",
  };
  return typeMap[type.toLowerCase()] ?? type.charAt(0).toUpperCase() + type.slice(1);
}

interface SharedGrantCardProps {
  sharedGrant: SharedGrant;
  onViewDetails: (credentialId: string) => void;
}

export function SharedGrantCard({ sharedGrant, onViewDetails }: SharedGrantCardProps) {
  const { grant, credential } = sharedGrant;
  const revokeGrant = useRevokeGrant();

  const isTimelocked = timelockToMs(Number(grant.locked_until)) >= Date.now();

  const publicNotes = credential?.publicNotes ?? {};
  const type = typeof publicNotes.type === "string" ? formatType(publicNotes.type) : "Grant";
  const issuer = typeof publicNotes.issuer === "string" ? publicNotes.issuer : null;
  const status = typeof publicNotes.status === "string" ? publicNotes.status : null;

  const detailEntries: readonly (readonly [string, string])[] = [
    ["Grant ID", grant.id],
    ["Cred ID", grant.data_id],
    ["Recipient", grant.ag_grantee_wallet_identifier],
    ["Time-lock", formatTimelock(Number(grant.locked_until))],
  ];

  return (
    <div className="bg-card flex w-full min-w-0 flex-col gap-4 rounded-xl border p-5">
      <div className="flex items-center gap-3">
        <div className="bg-primary/10 flex size-12 shrink-0 items-center justify-center rounded-lg">
          <Share2Icon size={24} className="text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{type}</p>
          {issuer && <p className="text-muted-foreground truncate text-sm">{issuer}</p>}
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
        {credential ? (
          <Button variant="secondary" onClick={() => onViewDetails(credential.originalId)}>
            <EyeIcon size={16} />
            Details
          </Button>
        ) : null}

        {!isTimelocked && (
          <Button
            variant="destructive"
            isLoading={revokeGrant.isPending && revokeGrant.variables?.id === grant.id}
            onClick={() =>
              revokeGrant.mutate(grant, {
                onSuccess: () =>
                  toast.success("Grant revoked", {
                    description: "The access grant has been successfully revoked.",
                  }),
                onError: () =>
                  toast.error("Failed to revoke grant", {
                    description: "An unexpected error occurred. Please try again.",
                  }),
              })
            }
          >
            <XCircleIcon size={16} />
            Revoke
          </Button>
        )}
      </div>
    </div>
  );
}
