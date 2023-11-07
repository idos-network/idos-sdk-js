import { Button, GridItem, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import { XIcon } from "lucide-react";
import { Credential } from "../queries";

type CredentialCardProps = {
  credential: Credential;
  onDelete: (credential: Credential) => void;
  onViewDetails: (credential: Credential) => void;
  onManageGrants?: () => void;
};

export const CredentialCard = (props: CredentialCardProps) => {
  return (
    <Stack
      gap={14}
      p={7}
      bg="neutral.900"
      border="1px solid"
      borderColor="neutral.800"
      rounded="xl"
    >
      <SimpleGrid maxW="container.lg" columns={[2, 4]} spacing={10}>
        <GridItem>
          <Text mb={5} color="neutral.600" fontSize="sm">
            Type
          </Text>
          <Text>{props.credential.credential_type}</Text>
        </GridItem>
        <GridItem>
          <Text mb={5} color="neutral.600" fontSize="sm">
            Issuer
          </Text>
          <Text>{props.credential.issuer}</Text>
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
        <Button
          onClick={() => props.onViewDetails(props.credential)}
          variant="ghost"
        >
          View Details
        </Button>
        <Button
          leftIcon={<XIcon />}
          onClick={() => props.onDelete(props.credential)}
          variant="ghost"
        >
          Delete
        </Button>
      </Stack>
    </Stack>
  );
};
