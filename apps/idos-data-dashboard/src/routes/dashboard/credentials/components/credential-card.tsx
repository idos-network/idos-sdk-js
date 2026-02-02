import { Button, ButtonGroup, GridItem, SimpleGrid } from "@chakra-ui/react";
import { KeyRoundIcon, XIcon } from "lucide-react";

import { useEffect } from "react";
import { useFetchGrants } from "../shared";
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
  const publicFields = JSON.parse(credential.public_notes);
  const shares = useFetchGrants({ credentialId: credential.id });

  const meta = Object.entries(publicFields)
    .filter(([key]) => key !== "id")
    .map(([key, value]) => [key, value]) as [string, string][];

  useEffect(() => {
    shares.refetch();
  }, [shares]);

  return (
    <div className="flex flex-col gap-16 p-5 bg-neutral-900 rounded-xl">
      <SimpleGrid columns={[2, 6]} spacing={10}>
        {meta.map(([key, value]) => (
          <GridItem key={key}>
            <span className="block mb-5 text-neutral-500 text-sm capitalize">{key}</span>
            <span>{value}</span>
          </GridItem>
        ))}
        <GridItem>
          <span className="block mb-5 text-neutral-500 text-sm">Shares</span>
          <span data-testid="shares-count" className="block">
            {shares.data?.length || 0}
          </span>
        </GridItem>
      </SimpleGrid>
      <div className="flex md:flex-row flex-col gap-5">
        <ButtonGroup
          w="full"
          spacing={0}
          gap={4}
          flexDir={{
            base: "column",
            lg: "row",
          }}
        >
          <Button id={`view-details-${credential.id}`} onClick={() => onViewDetails(credential.id)}>
            View details
          </Button>
          <Button
            id={`manage-grants-${credential.id}`}
            leftIcon={<KeyRoundIcon size={16} />}
            onClick={() => onManageGrants(credential.id)}
          >
            Manage grants
          </Button>
          <Button
            id={`delete-credential-${credential.id}`}
            leftIcon={<XIcon size={16} />}
            onClick={() => onDelete(credential)}
          >
            Delete
          </Button>
        </ButtonGroup>
      </div>
    </div>
  );
};
