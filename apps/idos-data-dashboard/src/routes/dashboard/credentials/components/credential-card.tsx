import { Button, GridItem, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import { XIcon } from "lucide-react";
import { Credential, CredentialStatus } from "../queries";

type CredentialCardProps = {
  credential: Credential;
  onDelete: (credential: Credential) => void;
  onViewDetails: (credential: Credential) => void;
  onManageGrants?: () => void;
};

const CredentialStatus = ({ status }: { status: CredentialStatus }) => {
  if (!status) {
    return <Text>-</Text>;
  }

  return (
    <Text
      color={
        status === "approved"
          ? "green.500"
          : status === "pending" || status === "contacted"
            ? "neutral.500"
            : status === "rejected" || status === "expired"
              ? "red.500"
              : "neutral.100"
      }
    >
      {status.toLocaleUpperCase()}
    </Text>
  );
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
      <SimpleGrid maxW="container.lg" columns={[2, 6]} spacing={10}>
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
            Status
          </Text>
          <CredentialStatus status={"approved"} />
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
        <Button onClick={() => props.onViewDetails(props.credential)} variant="ghost">
          View Details
        </Button>

        <Button
          leftIcon={<XIcon />}
          onClick={() => props.onViewDetails(props.credential)}
          variant="ghost"
        >
          Delete
        </Button>
      </Stack>
    </Stack>
  );
};
