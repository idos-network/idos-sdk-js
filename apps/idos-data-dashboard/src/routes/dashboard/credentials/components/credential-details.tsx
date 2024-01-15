import { useIdOS } from "@/core/idos";
import {
  Button,
  Center,
  Code,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Spinner,
  Text,
  useBreakpointValue
} from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";

import { idOSCredential } from "../types";

const useFetchCredentialDetails = ({
  credentialId,
  enabled
}: { credentialId: string; enabled: boolean }) => {
  const { sdk } = useIdOS();

  return useQuery({
    queryKey: ["credential_details", credentialId],
    queryFn: ({ queryKey: [, credentialId] }) =>
      sdk.data.get<idOSCredential & { content: string }>("credentials", credentialId),
    enabled
  });
};

type CredentialDetailsProps = {
  isOpen: boolean;
  credentialId: string;
  onClose: () => void;
};

export const CredentialDetails = ({ isOpen, credentialId, onClose }: CredentialDetailsProps) => {
  const credential = useFetchCredentialDetails({
    credentialId,
    enabled: isOpen
  });

  const isCentered = useBreakpointValue(
    {
      base: false,
      md: true
    },
    {
      fallback: "base"
    }
  );

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
