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
  useToast,
} from "@chakra-ui/react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import invariant from "tiny-invariant";

import { useInsertGrant } from "@/lib/contract";
import { encrypt } from "@/lib/encryption";
import { useStoredCredentials } from "@/lib/hooks";
import { useShareAttribute } from "../mutations";
import { useFetchAttributes } from "../queries";
import { Attribute } from "../types";

export type ShareAttributeProps = {
  isOpen: boolean;
  attribute?: Attribute;
  onClose: () => void;
};

export type ShareAttributeFormValues = {
  address: string;
  key: string;
};
export function ShareAttribute(props: ShareAttributeProps) {
  const { t } = useTranslation();
  const toast = useToast();
  const queryClient = useQueryClient();

  const { attribute } = props;

  const shareAttribute = useShareAttribute();
  const authCredentials = useStoredCredentials();
  const insertGrant = useInsertGrant();

  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm<ShareAttributeFormValues>();

  const onSubmit = (values: ShareAttributeFormValues) => {
    if (!attribute) return;

    invariant(authCredentials, "Credentials are not available");

    const encryptedContent = encrypt(attribute.value, values.key, authCredentials.secretKey);

    const newAttribute = {
      ...attribute,
      value: encryptedContent,
      id: crypto.randomUUID(),
    };

    shareAttribute.mutate(
      {
        ...newAttribute,
        original_attribute_id: attribute.id,
      },
      {
        onSuccess() {
          insertGrant.mutate(
            {
              address: values.address,
              id: newAttribute.id,
            },
            {
              onSuccess() {
                queryClient.invalidateQueries(useFetchAttributes.getKey());
                toast({
                  title: t("attribute-successfully-shared", { name: attribute.attribute_key }),
                });

                props.onClose();
              },
            }
          );
        },
      }
    );
  };

  const isMutating = shareAttribute.isLoading || insertGrant.isLoading;

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
        <>
          <ModalHeader>{t("share-attribute")}</ModalHeader>
          <ModalCloseButton />
          <form onSubmit={handleSubmit(onSubmit)}>
            <ModalBody>
              <VStack gap={5}>
                <FormControl isInvalid={!!errors.address}>
                  <FormLabel htmlFor="address">{t("attribute-address")}</FormLabel>
                  <Input
                    id="address"
                    placeholder={String(t("attribute-address"))}
                    {...register("address", {
                      required: String(t("field-is-required")),
                    })}
                  />

                  <FormErrorMessage>{errors.address && errors.address.message}</FormErrorMessage>
                </FormControl>
                <FormControl isInvalid={!!errors.key}>
                  <FormLabel htmlFor="key">{t("attribute-key")}</FormLabel>
                  <Input
                    id="key"
                    placeholder={String(t("attribute-key"))}
                    {...register("key", {
                      required: String(t("field-is-required")),
                    })}
                  />

                  <FormErrorMessage>{errors.key && errors.key.message}</FormErrorMessage>
                </FormControl>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button mr={3} colorScheme="orange" isLoading={isMutating} type="submit">
                {t("share-attribute")}
              </Button>
              <Button onClick={props.onClose} variant="ghost">
                {t("cancel")}
              </Button>
            </ModalFooter>
          </form>
        </>
      </ModalContent>
    </Modal>
  );
}
