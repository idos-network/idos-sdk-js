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

import { Attribute } from "../types";

export type AttributeEditorFormValues = {
  id?: string;
  attribute_key: string;
  value: string;
};

export type AttributeEditorProps = {
  isLoading: boolean;
  isOpen: boolean;
  values?: Attribute;

  onSubmit: (values: AttributeEditorFormValues) => void;
  onClose: () => void;
};

export function AttributeEditor(props: AttributeEditorProps) {
  const { t } = useTranslation();

  const { values } = props;

  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm<AttributeEditorFormValues>({
    values,
  });

  const title = values?.id ? t("edit-attribute") : t("new-attribute");

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
        <ModalHeader>{title}</ModalHeader>
        <ModalCloseButton />
        <form onSubmit={handleSubmit(props.onSubmit)}>
          <ModalBody>
            <VStack gap={5}>
              <FormControl isInvalid={!!errors.attribute_key}>
                <FormLabel htmlFor="name">{t("attribute-name")}</FormLabel>
                <Input
                  id="message"
                  placeholder={String(t("attribute-name"))}
                  {...register("attribute_key", {
                    required: String(t("field-is-required")),
                  })}
                />

                <FormErrorMessage>{errors.attribute_key && errors.attribute_key.message}</FormErrorMessage>
              </FormControl>
              <FormControl isInvalid={!!errors.value}>
                <FormLabel htmlFor="value">{t("attribute-value")}</FormLabel>
                <Input
                  id="message"
                  placeholder={String(t("attribute-value"))}
                  {...register("value", {
                    required: String(t("field-is-required")),
                  })}
                />

                <FormErrorMessage>{errors.value && errors.value?.message}</FormErrorMessage>
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button mr={3} colorScheme="orange" isLoading={props.isLoading} type="submit">
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
