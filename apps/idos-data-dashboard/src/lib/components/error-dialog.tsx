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

type ErrorDialogProps = {
  isOpen: boolean;
  title: string;
  description: string;
  isLoading: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function ErrorDialog(props: ErrorDialogProps) {
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
          <Button ml={3} colorScheme="red" isLoading={props.isLoading} onClick={props.onConfirm}>
            {t("ok")}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
