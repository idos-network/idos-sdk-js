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
  Text,
} from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import invariant from "tiny-invariant";

import { Loading } from "@/lib/components/loading";
import { decrypt } from "@/lib/encryption";
import { useStoredCredentials } from "@/lib/hooks";
import { useFetchCredentialDetails } from "../queries";
import { Credential } from "../types";

export type CredentialViewerProps = {
  isOpen: boolean;
  credential?: Credential;
  onClose: () => void;
};

export function CredentialViewer(props: CredentialViewerProps) {
  const { t } = useTranslation();
  const credentials = useStoredCredentials();

  invariant(credentials, "Credentials are not available");

  const credential = useFetchCredentialDetails({
    variables: {
      id: props.credential?.id as string,
    },
    enabled: !!props.credential?.id && props.isOpen,
    select: (credential) => ({
      ...credential,
      content: decrypt(credential.content, credentials.publicKey, credentials.secretKey),
    }),
  });

  return (
    <Modal
      isOpen={props.isOpen}
      onClose={props.onClose}
      size={{
        base: "full",
        md: "2xl",
      }}
    >
      <ModalOverlay />
      <ModalContent>
        {credential.isFetching ? (
          <Center p={10}>
            <Loading />
          </Center>
        ) : credential.isError ? (
          <>
            <ModalHeader isTruncated>
              {t("credential", { type: credential.data?.credential_type, issuer: credential.data?.issuer })}
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <Center p={10}>
                <Text color="red.400" fontWeight="semibold">
                  {t("error-while-reading-credential")}
                </Text>
              </Center>
            </ModalBody>
            <ModalFooter>
              <Button mr={3} colorScheme="orange" onClick={() => credential.refetch()}>
                {t("retry")}
              </Button>
              <Button onClick={props.onClose} variant="ghost">
                {t("cancel")}
              </Button>
            </ModalFooter>
          </>
        ) : (
          <>
            <ModalHeader isTruncated>
              {t("credential", { type: credential.data?.credential_type, issuer: credential.data?.issuer })}
            </ModalHeader>
            <ModalCloseButton />

            <ModalBody>
              <Code overflowX="auto" maxW="100%" whiteSpace="pre">
                {credential.data?.content}
              </Code>
            </ModalBody>

            <ModalFooter>
              <Button colorScheme="orange" onClick={props.onClose}>
                {t("done")}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
