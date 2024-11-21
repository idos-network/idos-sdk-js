import type { idOSCredential } from "@idos-network/issuer-sdk-js";
import { Button } from "@nextui-org/react";
import { Card, CardBody, CardFooter, CardHeader, Divider } from "@nextui-org/react";
import { CommandIcon } from "lucide-react";

export function CredentialCard({
  credential,
  onRevoke,
  onViewDetails,
}: {
  credential: idOSCredential;
  onRevoke: (id: string) => void;
  onViewDetails: (id: string) => void;
}) {
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
          <dd>{metadata.credential_status}</dd>
        </div>
        <Divider />

        <div className="inline-flex items-center gap-2">
          <dt className="min-w-32 text-neutral-500">Level:</dt>
          <dd>{metadata.credential_level}</dd>
        </div>
      </CardBody>
      <Divider />
      <CardFooter className="flex justify-end gap-4">
        <Button color="danger" variant="flat" onClick={() => onRevoke(credential.id)}>
          Revoke
        </Button>
        <Button color="primary" variant="solid" onClick={() => onViewDetails(credential.id)}>
          View credential details
        </Button>
      </CardFooter>
    </Card>
  );
}
