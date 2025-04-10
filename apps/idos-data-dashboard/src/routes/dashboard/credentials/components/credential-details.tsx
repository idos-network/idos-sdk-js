import { useIdOS } from "@/idOS.provider";
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
  Stack,
  Text,
  useBreakpointValue,
} from "@chakra-ui/react";
import { base64Decode, utf8Decode } from "@idos-network/core";
import { useQuery } from "@tanstack/react-query";
import { DownloadIcon } from "lucide-react";

const useFetchCredentialDetails = ({ credentialId }: { credentialId: string }) => {
  const idOSClient = useIdOS();

  return useQuery({
    queryKey: ["credential_details", credentialId],
    queryFn: async ({ queryKey: [, credentialId] }) => {
      const credential = await idOSClient.getCredentialOwned(credentialId);

      await idOSClient.enclaveProvider.ready(idOSClient.user.id);

      const decryptedContent = await idOSClient.enclaveProvider.decrypt(
        base64Decode(credential.content),
        base64Decode(credential.encryptor_public_key),
      );

      Object.assign(credential, { content: utf8Decode(decryptedContent) });

      return credential;
    },
    enabled: idOSClient.state === "logged-in",
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
  });

  const isCentered = useBreakpointValue(
    {
      base: false,
      md: true,
    },
    {
      fallback: "base",
    },
  );

  const jsonLink = `data:text/json;chatset=utf-8,${encodeURIComponent(
    JSON.stringify(credential.data),
  )}`;

  const credentialContent = credential.data?.content
    ? (() => {
        try {
          return JSON.stringify(JSON.parse(credential.data.content), null, 2);
        } catch (e) {
          return credential.data.content;
        }
      })()
    : "No content to display";

  const meta = credential.data?.public_notes ? JSON.parse(credential.data.public_notes) : {};

  const downloadFileName = credential.data?.public_notes
    ? `${meta.type || "credential"}_${meta.issuer || "unknown"}.json`
    : "credential.json";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size={{
        base: "full",
        lg: "2xl",
      }}
      isCentered={isCentered}
      scrollBehavior="inside"
    >
      <ModalOverlay />
      <ModalContent bg="neutral.900" rounded="xl">
        <ModalHeader>Credential details</ModalHeader>
        <ModalCloseButton onClick={onClose} />
        <ModalBody display="flex">
          {credential.isLoading ? (
            <Center flex={1}>
              <Spinner />
            </Center>
          ) : null}

          {credential.isError ? (
            <Stack>
              <Text color="red.500">Unable to fetch credential details.</Text>
              <Text color="red.500">{credential.error.message}</Text>
            </Stack>
          ) : null}

          {credential.isSuccess ? (
            <Code
              id="credential-details"
              overflowX="auto"
              maxW="100%"
              px={5}
              py={1}
              whiteSpace="pre"
              bg="neutral.950"
              rounded="xl"
            >
              {credentialContent}
            </Code>
          ) : null}
        </ModalBody>
        <ModalFooter gap={2.5}>
          {credential.isError ? <Button onClick={() => credential.refetch()}>Retry</Button> : false}
          <Button onClick={onClose}>Close</Button>
          {credential.isSuccess ? (
            <Button
              id={`download-credential-${credential.data?.id}`}
              as="a"
              href={jsonLink}
              colorScheme="green"
              leftIcon={<DownloadIcon />}
              download={downloadFileName}
            >
              Download as .json
            </Button>
          ) : null}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
