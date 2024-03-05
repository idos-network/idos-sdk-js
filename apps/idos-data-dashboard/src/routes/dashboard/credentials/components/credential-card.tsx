import { Button, ButtonGroup, GridItem, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import { KeyRoundIcon, XIcon } from "lucide-react";

import { idOSCredential } from "../types";

type CredentialCardProps = {
  credential: idOSCredential;
  onViewDetails: (credentialId: string) => void;
  onManageGrants: (credentialId: string) => void;
  onDelete: (credential: idOSCredential) => void;
};

export const CredentialCard = ({
  credential,
  onViewDetails,
  onManageGrants,
  onDelete
}: CredentialCardProps) => {
  return (
    <Stack gap={14} p={5} bg="neutral.900" rounded="xl">
      <SimpleGrid columns={[2, 6]} spacing={10}>
        <GridItem>
          <Text mb={5} color="neutral.500" fontSize="sm">
            Type
          </Text>
          <Text>{credential.credential_type}</Text>
        </GridItem>
        <GridItem>
          <Text mb={5} color="neutral.500" fontSize="sm">
            Issuer
          </Text>
          <Text>{credential.issuer}</Text>
        </GridItem>
        <GridItem>
          <Text mb={5} color="neutral.500" fontSize="sm">
            Status
          </Text>
          <Text>{credential.credential_status}</Text>
        </GridItem>
        <GridItem>
          <Text mb={5} color="neutral.500" fontSize="sm">
            Shares
          </Text>
          <Text>{credential.shares.length}</Text>
        </GridItem>
      </SimpleGrid>
      <Stack flexDir={["column", "row"]} gap={5}>
        <ButtonGroup
          w="full"
          spacing={0}
          gap={4}
          flexDir={{
            base: "column",
            lg: "row"
          }}
        >
          <Button onClick={() => onViewDetails(credential.id)}>View details</Button>
          <Button
            leftIcon={<KeyRoundIcon size={16} />}
            onClick={() => onManageGrants(credential.id)}
          >
            Manage grants
          </Button>
          <Button leftIcon={<XIcon size={16} />} onClick={() => onDelete(credential)}>
            Delete
          </Button>
        </ButtonGroup>
      </Stack>
    </Stack>
  );
};
