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

import { DownloadIcon } from "lucide-react";
import { idOSCredential } from "../types";

const useFetchCredentialDetails = ({ credentialId }: { credentialId: string }) => {
  const { sdk } = useIdOS();

  return useQuery({
    queryKey: ["credential_details", credentialId],
    queryFn: ({ queryKey: [, credentialId] }) =>
      sdk.data.get<idOSCredential & { content: string }>("credentials", credentialId)
  });
};

type CredentialDetailsProps = {
  isOpen: boolean;
  credentialId: string;
  onClose: () => void;
};

export const CredentialDetails = ({ isOpen, credentialId, onClose }: CredentialDetailsProps) => {
  const credential = useFetchCredentialDetails({
    credentialId
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

  const jsonLink = `data:text/json;chatset=utf-8,${encodeURIComponent(
    JSON.stringify(credential.data)
  )}`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size={{
        base: "full",
        lg: "2xl"
      }}
      isCentered={isCentered}
      scrollBehavior="inside"
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
            <Code overflowX="auto" maxW="100%" p={5} whiteSpace="pre" bg="neutral.950" rounded="xl">
              {credential.data ? credential.data.content : "No content to display"}
            </Code>
          ) : (
            false
          )}
        </ModalBody>
        <ModalFooter gap={2.5}>
          {credential.isError ? <Button onClick={() => credential.refetch()}>Retry</Button> : false}
          <Button onClick={onClose}>Close</Button>
          {credential.isSuccess ? (
            <Button
              as="a"
              href={jsonLink}
              colorScheme="green"
              leftIcon={<DownloadIcon />}
              download={`${credential.data?.credential_type}_${credential.data?.issuer}.json`}
            >
              Download as .json
            </Button>
          ) : null}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
