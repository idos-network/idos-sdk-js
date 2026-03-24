import { EyeIcon, FileCheckIcon, Share2Icon, Trash2Icon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatType, safeParse } from "@/lib/credential-utils";
import { useFetchGrants } from "@/lib/queries/credentials";

import type { idOSCredentialWithShares } from "./types";

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

const HEADER_FIELDS = new Set(["type", "status", "issuer", "id"]);

function formatLabel(key: string): string {
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

interface CredentialCardProps {
  credential: idOSCredentialWithShares;
  onViewDetails: (credentialId: string) => void;
  onManageGrants: (credentialId: string) => void;
  onDelete: (credential: idOSCredentialWithShares) => void;
}

export function CredentialCard({
  credential,
  onViewDetails,
  onManageGrants,
  onDelete,
}: CredentialCardProps) {
  const publicFields = safeParse(credential.public_notes);
  const grants = useFetchGrants({ credentialId: credential.id });

  const type = typeof publicFields.type === "string" ? formatType(publicFields.type) : "Credential";
  const issuer = typeof publicFields.issuer === "string" ? publicFields.issuer : null;
  const status = typeof publicFields.status === "string" ? publicFields.status : null;

  const detailEntries = Object.entries(publicFields)
    .filter(([key]) => !HEADER_FIELDS.has(key))
    .map(([key, value]) => [key, typeof value === "string" ? value : String(value ?? "")] as const);

  const grantsCount = grants.data?.length ?? 0;

  return (
    <div className="bg-card flex w-full flex-col gap-4 rounded-xl border p-5">
      <div className="flex items-center gap-3">
        <div className="bg-primary/10 flex size-12 shrink-0 items-center justify-center rounded-lg">
          <FileCheckIcon size={24} className="text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{type}</p>
          {issuer && <p className="text-muted-foreground truncate text-sm">{issuer}</p>}
        </div>
        {status && (
          <Badge
            variant={statusVariantMap[status.toLowerCase()] ?? "default"}
            className="shrink-0 capitalize"
          >
            {status}
          </Badge>
        )}
      </div>

      {detailEntries.length > 0 && (
        <div className="border-border bg-muted overflow-hidden rounded-lg border">
          <table className="table w-full border-collapse text-sm [&_td]:px-3 [&_td]:py-2 [&_th]:px-3 [&_th]:py-2">
            <tbody>
              {detailEntries.map(([key, value], i) => (
                <tr key={key} className={i < detailEntries.length - 1 ? "border-b" : ""}>
                  <th className="text-muted-foreground text-left font-medium">
                    {formatLabel(key)}
                  </th>
                  <td className="text-right">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center gap-2">
        <Button
          id={`view-details-${credential.id}`}
          variant="secondary"
          onClick={() => onViewDetails(credential.id)}
        >
          <EyeIcon size={16} />
          Details
        </Button>
        <Button
          variant="secondary"
          id={`manage-grants-${credential.id}`}
          onClick={() => onManageGrants(credential.id)}
        >
          <Share2Icon size={16} />
          Shared ({grantsCount})
        </Button>
        <Button
          variant="destructive"
          size="icon"
          className="ml-auto"
          id={`delete-credential-${credential.id}`}
          aria-label="Delete credential"
          onClick={() => onDelete(credential)}
        >
          <Trash2Icon size={16} />
        </Button>
      </div>
    </div>
  );
}
