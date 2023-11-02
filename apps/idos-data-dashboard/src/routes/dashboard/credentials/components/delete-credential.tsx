import {
  Box,
  Button,
  Flex,
  Heading,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  VStack
} from "@chakra-ui/react";
import { KeyIcon } from "lucide-react";
import { useDeleteCredential } from "../mutations";
import { Credential } from "../queries";

type DeleteCredentialProps = {
  isOpen: boolean;
  credential: Credential;
  onClose: () => void;
};
export const DeleteCredential = (props: DeleteCredentialProps) => {
  const deleteCredential = useDeleteCredential();

  const handleDelete = async () => {
    await deleteCredential.mutateAsync({
      id: props.credential.id
    });
    props.onClose();
  };

  return (
    <Modal
      isOpen={props.isOpen}
      onClose={props.onClose}
      size={{
        base: "full",
        md: "md"
      }}
    >
      <ModalOverlay />
      <ModalContent gap={5}>
        <ModalHeader mt={2}>
          <Heading fontSize="2xl" fontWeight="medium" textAlign="center">
            Delete Credential
          </Heading>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Flex direction="column" gap={10}>
            <Text>Do you want to delete this credential?</Text>
            <Flex
              gap={14}
              p={8}
              bg="neutral.800"
              border="1px solid"
              borderColor="neutral.600"
              rounded="xl"
            >
              <Box>
                <KeyIcon size={26} color="#00ffb9" />
              </Box>
              <VStack align="start" gap={2}>
                <Heading color="neutral.600" fontWeight="medium" size="sm">
                  Type
                </Heading>
                <Text>{props.credential.credential_type}</Text>
              </VStack>
              <VStack align="start" gap={4}>
                <Heading color="neutral.600" fontWeight="medium" size="sm">
                  Issuer
                </Heading>
                <Text>{props.credential.issuer}</Text>
              </VStack>
            </Flex>
          </Flex>
        </ModalBody>
        <ModalFooter
          alignItems="center"
          justifyContent="space-between"
          gap={10}
        >
          <Button onClick={props.onClose} variant="outline">
            Cancel
          </Button>

          <Button
            colorScheme="green"
            isLoading={deleteCredential.isPending}
            onClick={handleDelete}
          >
            Delete
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
