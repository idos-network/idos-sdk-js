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
  VStack
} from "@chakra-ui/react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { Wallet } from "../types";

export type WalletEditorFormValues = {
  address: string;
};

export type WalletEditorProps = {
  isOpen: boolean;
  values?: Wallet;
  isLoading?: boolean;
  onSubmit: (values: WalletEditorFormValues) => void;
  onClose: () => void;
};

export function WalletEditor(props: WalletEditorProps) {
  const { t } = useTranslation();

  const { values } = props;

  const {
    formState: { errors },
    handleSubmit,
    register,
    reset
  } = useForm<WalletEditorFormValues>({
    values
  });

  const title = values?.id ? t("edit-wallet") : t("new-wallet");

  return (
    <Modal
      isOpen={props.isOpen}
      onClose={props.onClose}
      onCloseComplete={reset}
      size={{
        base: "full",
        md: "lg"
      }}
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{title}</ModalHeader>
        <ModalCloseButton />
        <form onSubmit={handleSubmit(props.onSubmit)}>
          <ModalBody>
            <VStack gap={5}>
              <FormControl isInvalid={!!errors.address}>
                <FormLabel htmlFor="address">{t("wallet-address")}</FormLabel>
                <Input
                  id="address"
                  placeholder={String(t("wallet-address"))}
                  {...register("address", {
                    required: String(t("field-is-required"))
                  })}
                />

                <FormErrorMessage>
                  {errors.address && errors.address.message}
                </FormErrorMessage>
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button
              mr={3}
              colorScheme="orange"
              isLoading={props.isLoading}
              type="submit"
            >
              {t("save")}
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
