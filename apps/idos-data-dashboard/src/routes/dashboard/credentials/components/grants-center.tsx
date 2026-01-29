import type { idOSGrant } from "@idos-network/kwil-infra/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { timelockToMs } from "../../utils/time";
import { useFetchGrants, useRevokeGrant } from "../shared";

type GrantsCenterProps = {
  credentialId: string;
  isOpen: boolean;
  onClose: () => void;
};

function generateGrantId(grant: idOSGrant): string {
  const { data_id, ag_grantee_wallet_identifier, locked_until } = grant;
  return [data_id, ag_grantee_wallet_identifier, locked_until].join("-");
}

function timelockToDate(timelock: number): string {
  const milliseconds = timelockToMs(timelock);

  return new Intl.DateTimeFormat(["ban", "id"], {
    dateStyle: "short",
    timeStyle: "short",
    hour12: true,
  }).format(new Date(milliseconds));
}

const Shares = ({ credentialId, grants }: { credentialId: string; grants: idOSGrant[] }) => {
  const revokeGrant = useRevokeGrant(credentialId);

  if (grants.length === 0) {
    return (
      <span className="block" id="no-grants">
        You have not shared this credential with anyone.
      </span>
    );
  }

  const onRevoke = (grant: idOSGrant) => {
    revokeGrant.mutate(grant);
  };

  return (
    <div className="flex flex-col items-stretch gap-8">
      <div className="flex flex-col gap-2">
        <span className="block">Credentials Grants Access Center</span>
        <span className="block text-neutral-500">
          This is where you can manage your credentials grants. You can choose which access is
          revoked or granted.
        </span>
      </div>
      <div className="rounded-lg bg-neutral-800 border! border-neutral-700">
        <table
          className="w-full border-collapse table [&_td]:px-4 [&_td]:py-3 [&_th]:px-4 [&_th]:py-3"
          id={`grants-for-${credentialId}`}
        >
          <thead>
            <tr className="border-b!">
              <th className="text-neutral-500 text-left">Consumer</th>
              <th className="text-neutral-500 text-left">Locked until</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {grants.map((grant) => (
              <tr
                key={generateGrantId(grant)}
                id={`grant-${generateGrantId(grant)}`}
                data-grant={JSON.stringify(grant)}
              >
                <td className="max-w-[140px]">
                  <span className="block truncate">{grant.ag_grantee_wallet_identifier}</span>
                </td>
                <td>
                  <span className="block">
                    {+grant.locked_until ? timelockToDate(+grant.locked_until) : "No timelock"}
                  </span>
                </td>
                <td className="text-right">
                  <Button
                    id={`revoke-grant-${generateGrantId(grant)}`}
                    size="sm"
                    variant="destructiveOutline"
                    disabled={timelockToMs(+grant.locked_until) >= Date.now()}
                    isLoading={
                      revokeGrant.isPending && revokeGrant.variables?.data_id === grant.data_id
                    }
                    onClick={() => onRevoke(grant)}
                  >
                    Revoke
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const GrantsCenter = ({ credentialId, isOpen, onClose }: GrantsCenterProps) => {
  const grants = useFetchGrants({ credentialId });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Grants center</DialogTitle>
        </DialogHeader>
        <div>
          {grants.isLoading ? (
            <div className="flex flex-1 items-center justify-center">
              <Spinner className="size-8" />
            </div>
          ) : null}
          {grants.isError ? (
            <span role="alert" className="block text-red-500">
              Something went wrong, please retry.
            </span>
          ) : null}
          {grants.isSuccess ? <Shares credentialId={credentialId} grants={grants.data} /> : null}
        </div>
        <DialogFooter className="gap-2.5">
          {grants.isError ? (
            <Button variant="secondary" onClick={() => grants.refetch()}>
              Retry
            </Button>
          ) : null}
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
