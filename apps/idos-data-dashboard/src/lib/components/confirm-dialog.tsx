import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogCloseButton,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Button,
} from "@chakra-ui/react";
import { useRef } from "react";
import { useTranslation } from "react-i18next";

type ConfirmDialogProps = {
  isOpen: boolean;
  title: string;
  description: string;
  isLoading: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function ConfirmDialog(props: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const { t } = useTranslation();
  return (
    <AlertDialog
      isCentered
      isOpen={props.isOpen}
      leastDestructiveRef={cancelRef}
      motionPreset="slideInBottom"
      onClose={props.onClose}
    >
      <AlertDialogOverlay />

      <AlertDialogContent>
        <AlertDialogHeader>{props.title}</AlertDialogHeader>
        <AlertDialogCloseButton />
        <AlertDialogBody>{props.description}</AlertDialogBody>
        <AlertDialogFooter>
          <Button ref={cancelRef} onClick={props.onClose}>
            {t("no")}
          </Button>
          <Button ml={3} colorScheme="red" isLoading={props.isLoading} onClick={props.onConfirm}>
            {t("yes")}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
