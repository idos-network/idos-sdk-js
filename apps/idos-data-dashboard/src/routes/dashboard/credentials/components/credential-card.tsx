import { KeyRoundIcon, XIcon } from "lucide-react";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { safeParse, useFetchGrants } from "../shared";
import type { idOSCredentialWithShares } from "../types";

type CredentialCardProps = {
  credential: idOSCredentialWithShares;
  onViewDetails: (credentialId: string) => void;
  onManageGrants: (credentialId: string) => void;
  onDelete: (credential: idOSCredentialWithShares) => void;
};

export const CredentialCard = ({
  credential,
  onViewDetails,
  onManageGrants,
  onDelete,
}: CredentialCardProps) => {
  const publicFields = safeParse(credential.public_notes);
  const shares = useFetchGrants({ credentialId: credential.id });

  const meta = Object.entries(publicFields)
    .filter(([key]) => key !== "id")
    .map(([key, value]) => [key, value]) as [string, string][];

  useEffect(() => {
    shares.refetch();
  }, [shares]);

  return (
    <div className="flex flex-col gap-16 rounded-xl bg-neutral-900 p-5">
      <div className="grid grid-cols-2 gap-10 lg:grid-cols-6">
        {meta.map(([key, value]) => (
          <div key={key} className="flex flex-col items-stretch gap-2">
            <span className="mb-5 block text-neutral-500 text-sm capitalize">{key}</span>
            <span>{value}</span>
          </div>
        ))}
        <div>
          <span className="mb-5 block text-neutral-500 text-sm">Shares</span>
          <span data-testid="shares-count" className="block">
            {shares.data?.length || 0}
          </span>
        </div>
      </div>
      <div className="flex flex-col gap-5 md:flex-row">
        <div className="flex w-full flex-col gap-4 lg:flex-row">
          <Button
            id={`view-details-${credential.id}`}
            variant="secondary"
            onClick={() => onViewDetails(credential.id)}
          >
            View details
          </Button>
          <Button
            variant="secondary"
            id={`manage-grants-${credential.id}`}
            onClick={() => onManageGrants(credential.id)}
          >
            <KeyRoundIcon size={16} />
            Manage grants
          </Button>
          <Button
            variant="secondary"
            id={`delete-credential-${credential.id}`}
            onClick={() => onDelete(credential)}
          >
            <XIcon size={16} />
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
};
