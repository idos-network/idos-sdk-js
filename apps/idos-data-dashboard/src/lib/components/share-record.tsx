import {
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  VStack,
} from "@chakra-ui/react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

export type ShareRecordProps = {
  isOpen: boolean;
  title: string;
  onClose: () => void;
};

export type ShareRecordFormValues = {
  address: string;
  key: string;
};
export function ShareRecord(props: ShareRecordProps) {
  const { t } = useTranslation();

  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm<ShareRecordFormValues>();

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const onSubmit = (_values: ShareRecordFormValues) => {
    // @todo: implement
  };

  return (
    <Modal
      isOpen={props.isOpen}
      onClose={props.onClose}
      onCloseComplete={reset}
      size={{
        base: "full",
        md: "lg",
      }}
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{props.title}</ModalHeader>
        <ModalCloseButton />
        <form onSubmit={handleSubmit(onSubmit)}>
          <ModalBody>
            <VStack gap={5}>
              <FormControl isInvalid={!!errors.address}>
                <FormLabel htmlFor="address">{t("share-record-address")}</FormLabel>
                <Input
                  id="address"
                  placeholder={String(t("share-record-address"))}
                  {...register("address", {
                    required: String(t("field-is-required")),
                  })}
                />

                <FormErrorMessage>{errors.address && errors.address.message}</FormErrorMessage>
              </FormControl>
              <FormControl isInvalid={!!errors.key}>
                <FormLabel htmlFor="key">{t("share-record-key")}</FormLabel>
                <Input
                  id="key"
                  placeholder={String(t("share-record-key"))}
                  {...register("key", {
                    required: String(t("field-is-required")),
                  })}
                />

                <FormErrorMessage>{errors.key && errors.key.message}</FormErrorMessage>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button mr={3} colorScheme="orange" type="submit">
              {t("share-credential")}
            </Button>
            <Button onClick={props.onClose} variant="ghost">
              {t("cancel")}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
