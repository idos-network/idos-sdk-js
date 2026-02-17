import { KeyRoundIcon, XIcon } from "lucide-react";

import { useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useFetchGrants } from "@/lib/queries/credentials";
import { safeParse } from "./shared";
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
  const shares = useFetchGrants({ credentialId: credential.id });

  const fieldOrder = ["type", "status", "issuer", "level"];
  const entries = Object.entries(publicFields).filter(([key]) => key !== "id") as [
    string,
    string,
  ][];
  const meta = entries.sort(([a], [b]) => {
    const ai = fieldOrder.indexOf(a);
    const bi = fieldOrder.indexOf(b);
    if (ai !== -1 && bi !== -1) {
      return ai - bi;
    }
    if (ai !== -1) {
      return -1;
    }
    if (bi !== -1) {
      return 1;
    }
    return 0;
  });

  useEffect(() => {
    shares.refetch();
  }, [shares]);

  return (
    <div className="flex flex-col gap-12 p-5 bg-neutral-900 rounded-xl">
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-5">
        {meta.map(([key, value]) => (
          <div key={key} className="flex flex-col gap-2">
            <span className="text-neutral-500 text-sm capitalize">{key}</span>
            {key === "status" ? (
              <Badge
                variant={statusVariantMap[value.toLowerCase()] ?? "default"}
                className="w-fit capitalize"
              >
                {value}
              </Badge>
            ) : (
              <span className="truncate">{value}</span>
            )}
          </div>
        ))}
        <div className="flex flex-col gap-2">
          <span className="text-neutral-500 text-sm">Shares</span>
          <span data-test-id="shares-count">{shares.data?.length || 0}</span>
        </div>
      </div>
      <div className="flex flex-col lg:flex-row gap-4">
        <Button
          id={`view-details-${credential.id}`}
          variant="secondary"
          size="lg"
          onClick={() => onViewDetails(credential.id)}
        >
          View details
        </Button>
        <Button
          variant="secondary"
          size="lg"
          id={`manage-grants-${credential.id}`}
          onClick={() => onManageGrants(credential.id)}
        >
          <KeyRoundIcon size={16} />
          Manage grants
        </Button>
        <Button
          variant="secondary"
          size="lg"
          id={`delete-credential-${credential.id}`}
          onClick={() => onDelete(credential)}
        >
          <XIcon size={16} />
          Delete
        </Button>
      </div>
    </div>
  );
}
