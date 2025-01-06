import { Button, ButtonGroup, GridItem, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import { KeyRoundIcon, XIcon } from "lucide-react";

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
  const grants = useFetchGrants({ credentialId: credential.id });

  const meta = Object.entries(publicFields)
    .filter(([key]) => key !== "id")
    .map(([key, value]) => [key, value]) as [string, string][];

  return (
    <Stack gap={14} p={5} bg="neutral.900" rounded="xl">
      <SimpleGrid columns={[2, 6]} spacing={10}>
        {meta.map(([key, value]) => (
          <GridItem key={key}>
            <Text mb={5} color="neutral.500" fontSize="sm" textTransform="capitalize">
              {key}
            </Text>
            <Text>{value}</Text>
          </GridItem>
        ))}
        <GridItem>
          <Text mb={5} color="neutral.500" fontSize="sm">
            Shares
          </Text>
          <Text>{grants.data?.length || 0}</Text>
        </GridItem>
      </SimpleGrid>
      <Stack flexDir={["column", "row"]} gap={5}>
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
      </Stack>
    </Stack>
  );
};
