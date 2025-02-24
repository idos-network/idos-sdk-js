import { Button } from "@heroui/react";
import { Card, CardBody, CardFooter, CardHeader, Divider } from "@heroui/react";
import type { idOSCredential } from "@idos-network/issuer-sdk-js/server";
import { CommandIcon } from "lucide-react";
import { Fragment, useTransition } from "react";

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
  const publicFields = JSON.parse(credential.public_notes || "{}");
  const revocationId = publicFields.id;
  const issuer = publicFields.issuer ?? "Unknown Issuer";
  const metadata = Object.entries(publicFields) as [string, string][];
  const isRevoked = publicFields.status === "revoked";

  return (
    // biome-ignore lint/a11y/useSemanticElements: <explanation>
    <Card role="listitem">
      <CardHeader className="flex gap-3">
        <div className="inline-flex items-center justify-center rounded-lg bg-gray-200 p-2">
          <CommandIcon size={24} className="text-neutral-950" />
        </div>
        <div className="flex flex-col">
          <p className="text-md">{issuer}</p>
        </div>
      </CardHeader>
      <Divider />

      <CardBody className="flex flex-col gap-4 text-sm">
        {metadata.map(([key, value]) => (
          <Fragment key={key}>
            <div className="inline-flex items-center gap-2">
              <dt className="min-w-32 text-neutral-500 capitalize">{key}:</dt>
              <dd>{value}</dd>
            </div>
          </Fragment>
        ))}
      </CardBody>
      <Divider />
      <CardFooter className="flex justify-end gap-4">
        {!isRevoked && !!metadata.length ? (
          <Button
            color="danger"
            variant="flat"
            isLoading={isRevoking}
            onPress={() => {
              startRevokeTransition(() => {
                onRevoke(revocationId);
              });
            }}
          >
            Revoke
          </Button>
        ) : null}
        <Button
          color="primary"
          variant="solid"
          onPress={() => onViewDetails(credential.id)}
          id="view-details-btn"
        >
          View credential details
        </Button>
      </CardFooter>
    </Card>
  );
}
