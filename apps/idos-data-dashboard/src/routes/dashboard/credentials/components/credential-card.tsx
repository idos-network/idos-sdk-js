import {
  Button,
  Center,
  GridItem,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalOverlay,
  SimpleGrid,
  Stack,
  Text,
  useDisclosure
} from "@chakra-ui/react";
import { XIcon } from "lucide-react";
import { isMobile } from "react-device-detect";
import { Credential } from "../queries";

type CredentialCardProps = {
  credential: Credential;
  onDelete: (credential: Credential) => void;
  onViewDetails: (credential: Credential) => void;
  onManageGrants?: () => void;
};

export const CredentialCard = (props: CredentialCardProps) => {
  const { isOpen, onClose, onOpen } = useDisclosure();

  const handleViewDetails = () => {
    isMobile ? onOpen() : props.onViewDetails(props.credential);
  };

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
        <Button onClick={handleViewDetails} variant="ghost">
          View Details
        </Button>

        <Button
          leftIcon={<XIcon />}
          onClick={handleViewDetails}
          variant="ghost"
        >
          Delete
        </Button>
      </Stack>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size={{
          base: "full",
          md: "2xl"
        }}
      >
        <ModalOverlay />
        <ModalContent>
          <ModalCloseButton />
          <ModalBody>
            <Center p={5}>
              <Text px={3} py={1} color="red.400" rounded="lg">
                Please use the idOS Dashboard in your desktop's browser to see
                your credential's content
              </Text>
            </Center>
          </ModalBody>
          <ModalFooter>
            <Button onClick={onClose} variant="ghost">
              Ok
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Stack>
  );
};
