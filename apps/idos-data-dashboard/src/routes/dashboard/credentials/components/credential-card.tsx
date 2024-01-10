import {
  Button,
  ButtonGroup,
  Center,
  Code,
  GridItem,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  SimpleGrid,
  Spinner,
  Stack,
  Text,
  useBreakpointValue,
  useDisclosure
} from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";

import { useIdOS } from "@/core/idos";
import { idOSCredential } from "../types";

type CredentialDetailsProps = {
  isOpen: boolean;
  recordId: string;
  onClose: () => void;
};

const useFetchCredentialDetails = ({
  recordId,
  enabled
}: { recordId: string; enabled: boolean }) => {
  const { sdk } = useIdOS();

  return useQuery({
    queryKey: ["credential_details", recordId],
    queryFn: ({ queryKey: [, recordId] }) =>
      sdk.data.get<idOSCredential & { content: string }>("credentials", recordId),
    enabled
  });
};

const CredentialDetails = ({ isOpen, recordId, onClose }: CredentialDetailsProps) => {
  const isCentered = useBreakpointValue(
    {
      base: false,
      md: true
    },
    {
      fallback: "base"
    }
  );

  const credential = useFetchCredentialDetails({ recordId, enabled: isOpen });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size={{
        base: "full",
        lg: "xl"
      }}
      isCentered={isCentered}
    >
      <ModalOverlay />
      <ModalContent bg="neutral.900" rounded="xl">
        <ModalHeader>Credential details</ModalHeader>
        <ModalCloseButton onClick={onClose} />
        <ModalBody display="flex" alignItems="center">
          {credential.isLoading ? (
            <Center flex={1}>
              <Spinner />
            </Center>
          ) : (
            false
          )}
          {credential.isError ? (
            <Text color="red.500">Something went wrong, please retry.</Text>
          ) : (
            false
          )}
          {credential.isSuccess ? (
            <Code overflowX="auto" maxW="100%" p={5} whiteSpace="pre">
              {credential.data ? credential.data.content : "No content to display"}
            </Code>
          ) : (
            false
          )}
          <Code />
        </ModalBody>
        <ModalFooter gap={2.5}>
          {credential.isError ? <Button onClick={() => credential.refetch()}>Retry</Button> : false}
          <Button onClick={onClose}>Close</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

type CredentialCardProps = {
  credential: idOSCredential;
};

export const CredentialCard = ({ credential }: CredentialCardProps) => {
  const { isOpen, onOpen, onClose } = useDisclosure();

  const handleOpen = () => {
    onOpen();
  };

  const handleClose = () => {
    onClose();
  };

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
          <Button onClick={handleOpen}>View details</Button>
        </ButtonGroup>
      </Stack>
      <CredentialDetails isOpen={isOpen} recordId={credential.id} onClose={handleClose} />
    </Stack>
  );
};
