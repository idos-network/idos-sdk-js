import {
  Button,
  Center,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalOverlay,
  Text
} from "@chakra-ui/react";

type MobileAlertProps = {
  isOpen: boolean;
  content?: string;
  onClose: () => void;
};
export const MobileAlert = (props: MobileAlertProps) => {
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
        <ModalCloseButton />
        <ModalBody>
          <Center p={5}>
            <Text color="green.500" fontSize="lg" textAlign="center">
              {props.content}
            </Text>
          </Center>
        </ModalBody>
        <ModalFooter>
          <Button onClick={props.onClose} variant="ghost">
            Ok
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
