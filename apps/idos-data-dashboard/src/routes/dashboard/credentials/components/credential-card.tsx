import { Button, ButtonGroup, GridItem, SimpleGrid, Stack, Text } from "@chakra-ui/react";

import { idOSCredential } from "../types";

type CredentialCardProps = {
  credential: idOSCredential;
  onViewDetails: (credentialId: string) => void;
};

export const CredentialCard = ({ credential, onViewDetails }: CredentialCardProps) => {
  return (
    <Stack gap={14} p={5} bg="neutral.900" rounded="xl">
      <SimpleGrid columns={[2, 6]} spacing={10}>
        <GridItem>
          <Text mb={5} color="neutral.600" fontSize="sm">
            Type
          </Text>
          <Text>{credential.credential_type}</Text>
        </GridItem>
        <GridItem>
          <Text mb={5} color="neutral.600" fontSize="sm">
            Issuer
          </Text>
          <Text>{credential.issuer}</Text>
        </GridItem>
        <GridItem>
          <Text mb={5} color="neutral.600" fontSize="sm">
            Status
          </Text>
          <Text>{credential.credential_status}</Text>
        </GridItem>
        <GridItem>
          <Text mb={5} color="neutral.600" fontSize="sm">
            Grants
          </Text>
          <Text>-</Text>
        </GridItem>
        <GridItem>
          <Text mb={5} color="neutral.600" fontSize="sm">
            Shares
          </Text>
          <Text>-</Text>
        </GridItem>
      </SimpleGrid>
      <Stack flexDir={["column", "row"]} gap={5}>
        <ButtonGroup
          spacing={0}
          gap={4}
          flexDir={{
            base: "column",
            lg: "row"
          }}
        >
          <Button onClick={() => onViewDetails(credential.id)}>View details</Button>
        </ButtonGroup>
      </Stack>
    </Stack>
  );
};
