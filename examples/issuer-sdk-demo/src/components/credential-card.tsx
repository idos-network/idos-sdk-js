import type { idOSCredential } from "@idos-network/issuer-sdk-js";
import { Button } from "@nextui-org/react";
import { Card, CardBody, CardFooter, CardHeader, Divider } from "@nextui-org/react";
import { CommandIcon } from "lucide-react";
import { useTransition } from "react";

export function CredentialCard({
  credential,

  onRevoke,
  onViewDetails,
}: {
  credential: idOSCredential;
  onRevoke: (id: string) => void;
  onViewDetails: (id: string) => void;
}) {
  const [isRevoking, startRevokeTransition] = useTransition();
  const metadata = JSON.parse(credential.public_notes);

  return (
    <Card>
      <CardHeader className="flex gap-3">
        <div className="inline-flex items-center justify-center rounded-lg bg-gray-200 p-2">
          <CommandIcon size={24} className="text-neutral-950" />
        </div>
        <div className="flex flex-col">
          <p className="text-md">{metadata.issuer}</p>
        </div>
      </CardHeader>
      <Divider />

      <CardBody className="flex flex-col gap-4 text-sm">
        <div className="inline-flex items-center gap-2">
          <dt className="min-w-32 text-neutral-500">Type:</dt>
          <dd>{metadata.credential_type}</dd>
        </div>
        <Divider />

        <div className="inline-flex items-center gap-2">
          <dt className="min-w-32 text-neutral-500">Status:</dt>
          <dd
            className={metadata.credential_status === "revoked" ? "text-red-500" : "text-green-500"}
          >
            {metadata.credential_status}
          </dd>
        </div>
        <Divider />

        <div className="inline-flex items-center gap-2">
          <dt className="min-w-32 text-neutral-500">Level:</dt>
          <dd>{metadata.credential_level}</dd>
        </div>
      </CardBody>
      <Divider />
      <CardFooter className="flex justify-end gap-4">
        {metadata.credential_status !== "revoked" ? (
          <Button
            color="danger"
            variant="flat"
            isLoading={isRevoking}
            onClick={() => {
              startRevokeTransition(() => {
                onRevoke(metadata.id);
              });
            }}
          >
            Revoke
          </Button>
        ) : null}
        <Button color="primary" variant="solid" onClick={() => onViewDetails(credential.id)}>
          View credential details
        </Button>
      </CardFooter>
    </Card>
  );
}
