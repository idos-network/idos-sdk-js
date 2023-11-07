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
  Spinner
} from "@chakra-ui/react";

import { DownloadIcon } from "lucide-react";
import { Credential, useFetchCredentialDetails } from "../queries";

export type CredentialViewerProps = {
  isOpen: boolean;
  credential: Credential;
  onClose: () => void;
};

export const CredentialViewer = (props: CredentialViewerProps) => {
  const credential = useFetchCredentialDetails({
    variables: {
      id: props.credential.id
    },
    enabled: !!props.credential.id && props.isOpen
  });

  const onDownload = () => {
    // create a donwlodable json file
    if (credential.data) {
      const file = new Blob([credential.data?.content], {
        type: "application/json"
      });
      const href = URL.createObjectURL(file);
      window.open(href, "_blank");
    }
  };

  return (
    <Modal
      isOpen={props.isOpen}
      onClose={props.onClose}
      size={{
        base: "full",
        md: "2xl"
      }}
    >
      <ModalOverlay />
      <ModalContent>
        {credential.isFetching ? (
          <Center>
            <Spinner />
          </Center>
        ) : credential.isError ? (
          <>
            <ModalCloseButton />
            <ModalBody>
              <Center p={5}>
                <Code px={3} py={1} color="red.400" rounded="lg">
                  Error while reading credential data
                </Code>
              </Center>
            </ModalBody>
            <ModalFooter>
              <Button mr={3} onClick={() => credential.refetch()}>
                Retry
              </Button>
              <Button onClick={props.onClose} variant="ghost">
                Cancel
              </Button>
            </ModalFooter>
          </>
        ) : (
          <>
            <ModalHeader />
            <ModalCloseButton />
            <ModalBody>
              <Code overflowX="auto" maxW="100%" p={5} whiteSpace="pre">
                {credential.data?.content}
              </Code>
            </ModalBody>

            <ModalFooter alignItems="center" justifyContent="center" gap={10}>
              <Button onClick={props.onClose} variant="outline">
                Close
              </Button>
              {credential.isSuccess ? (
                <Button
                  colorScheme="green"
                  leftIcon={<DownloadIcon />}
                  onClick={onDownload}
                >
                  Download .json file
                </Button>
              ) : null}
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};
