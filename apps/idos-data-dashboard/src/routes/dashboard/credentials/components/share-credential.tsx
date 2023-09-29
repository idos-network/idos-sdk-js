import {
  Button,
  Center,
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
  Text,
  VStack,
  useToast,
} from "@chakra-ui/react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import invariant from "tiny-invariant";

import { Loading } from "@/lib/components/loading";
import { useInsertGrant } from "@/lib/contract";
import { decrypt, encrypt } from "@/lib/encryption";
import { useStoredCredentials } from "@/lib/hooks";
import { useShareCredential } from "../mutations";
import { useFetchCredentialDetails, useFetchCredentials } from "../queries";
import { Credential } from "../types";

export type ShareCredentialProps = {
  isOpen: boolean;
  credential?: Credential;
  onClose: () => void;
};

export type ShareCredentialFormValues = {
  address: string;
  key: string;
};
export function ShareCredential(props: ShareCredentialProps) {
  const { t } = useTranslation();
  const toast = useToast();
  const queryClient = useQueryClient();

  const credentialDetails = useFetchCredentialDetails({
    variables: {
      id: props.credential?.id as string,
    },
    enabled: !!props.credential?.id && props.isOpen,
  });
  const shareCredential = useShareCredential();
  const authCredentials = useStoredCredentials();
  const insertGrant = useInsertGrant();

  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm<ShareCredentialFormValues>();

  const onSubmit = (values: ShareCredentialFormValues) => {
    if (!credentialDetails.isSuccess) return;

    invariant(authCredentials, "Credentials are not available");

    const decryptedContent = decrypt(
      credentialDetails.data?.content as string,
      authCredentials.publicKey,
      authCredentials.secretKey
    );

    const encryptedContent = encrypt(decryptedContent, values.key, authCredentials.secretKey);

    const credential = {
      ...credentialDetails.data,
      content: encryptedContent,
      id: crypto.randomUUID(),
    };

    shareCredential.mutate(
      {
        ...credential,
        original_credential_id: credentialDetails.data.id,
      },
      {
        onSuccess() {
          insertGrant.mutate(
            {
              address: values.address,
              id: credential.id,
            },
            {
              onSuccess() {
                props.onClose();
                toast({
                  title: t("credential-successfully-shared"),
                });
                queryClient.invalidateQueries(useFetchCredentials.getKey());
              },
            }
          );
        },
      }
    );
  };

  const isMutating = shareCredential.isLoading || insertGrant.isLoading;

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
        {credentialDetails.isFetching ? (
          <Center p={10}>
            <Loading />
          </Center>
        ) : credentialDetails.isError ? (
          <>
            <ModalHeader>{t("share-credential")}</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <Center p={10}>
                <Text color="red.400" fontWeight="semibold">
                  {t("error-while-reading-credential")}
                </Text>
              </Center>
            </ModalBody>
            <ModalFooter>
              <Button mr={3} colorScheme="orange" onClick={() => credentialDetails.refetch()}>
                {t("retry")}
              </Button>
              <Button onClick={props.onClose} variant="ghost">
                {t("cancel")}
              </Button>
            </ModalFooter>
          </>
        ) : (
          <>
            <ModalHeader>{t("share-credential")}</ModalHeader>
            <ModalCloseButton />
            <form onSubmit={handleSubmit(onSubmit)}>
              <ModalBody>
                <VStack gap={5}>
                  <FormControl isInvalid={!!errors.address}>
                    <FormLabel htmlFor="address">{t("credential-address")}</FormLabel>
                    <Input
                      id="address"
                      placeholder={String(t("credential-address"))}
                      {...register("address", {
                        required: String(t("field-is-required")),
                      })}
                    />

                    <FormErrorMessage>{errors.address && errors.address.message}</FormErrorMessage>
                  </FormControl>
                  <FormControl isInvalid={!!errors.key}>
                    <FormLabel htmlFor="key">{t("credential-key")}</FormLabel>
                    <Input
                      id="key"
                      placeholder={String(t("credential-key"))}
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
                  {t("share-credential")}
                </Button>
                <Button onClick={props.onClose} variant="ghost">
                  {t("cancel")}
                </Button>
              </ModalFooter>
            </form>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
