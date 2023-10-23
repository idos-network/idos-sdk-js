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
  Textarea,
  VStack,
  useToast
} from "@chakra-ui/react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { Loading } from "@/lib/components/loading";
import { useQueryClient } from "@tanstack/react-query";
import { useCreateCredential, useUpdateCredential } from "../mutations";
import { useFetchCredentialDetails, useFetchCredentials } from "../queries";
import { Credential } from "../types";

export type CredentialEditorFormValues = {
  id?: string;
  issuer: string;
  credential_type: string;
  encryption_public_key: string;
  content: string;
};

export type CredentialEditorProps = {
  isOpen: boolean;
  credential?: Credential;
  onClose: () => void;
};

export function CredentialEditor(props: CredentialEditorProps) {
  const { t } = useTranslation();
  const toast = useToast();

  const credential = useFetchCredentialDetails({
    variables: {
      id: props.credential?.id as string
    },
    enabled: !!props.credential?.id && props.isOpen
  });

  const {
    formState: { errors },
    handleSubmit,
    register,
    reset
  } = useForm<CredentialEditorFormValues>({
    values: {
      id: credential.data?.id ?? "",
      issuer: credential.data?.issuer ?? "",
      credential_type: credential.data?.credential_type ?? "",
      encryption_public_key: credential.data?.encryption_public_key ?? "",
      content: credential.data?.content ?? ""
    }
  });

  const queryClient = useQueryClient();
  const createCredential = useCreateCredential({
    async onMutate(credential) {
      await queryClient.cancelQueries(useFetchCredentials.getKey());

      const previousCredentials = queryClient.getQueryData<Credential[]>(
        useFetchCredentials.getKey()
      );

      if (previousCredentials) {
        const newCredential: Credential = {
          ...credential,
          id: crypto.randomUUID(),
          original_id: "",
          human_id: "",
          encryption_public_key: ""
        };
        queryClient.setQueryData<Credential[]>(useFetchCredentials.getKey(), [
          ...previousCredentials,
          newCredential
        ]);
      }

      return { previousCredentials };
    },
    onError(_, __, context) {
      if (context?.previousCredentials) {
        queryClient.setQueryData<Credential[]>(useFetchCredentials.getKey(), [
          ...context.previousCredentials
        ]);
      }
      props.onClose();
    }
  });

  const updateCredential = useUpdateCredential({
    async onMutate(vars) {
      await queryClient.cancelQueries(useFetchCredentials.getKey());
      const previousCredentials =
        queryClient.getQueryData<Credential[]>(useFetchCredentials.getKey()) ??
        [];

      const credentialIndex =
        previousCredentials?.findIndex(({ id }) => id === vars.id) ?? -1;
      previousCredentials[credentialIndex] = {
        ...vars,
        human_id: "",
        original_id: ""
      };
      queryClient.setQueryData<Credential[]>(useFetchCredentials.getKey(), [
        ...previousCredentials
      ]);
      credential.setData({ ...vars, human_id: "", original_id: "" });
      return { previousCredentials };
    },
    onError(_, __, context) {
      if (context?.previousCredentials) {
        queryClient.setQueryData<Credential[]>(useFetchCredentials.getKey(), [
          ...context.previousCredentials
        ]);
      }
      props.onClose();
    }
  });

  const onSubmit = (values: CredentialEditorFormValues) => {
    if (values.id) {
      console.log(values.id);
      return updateCredential.mutate(
        {
          ...values,
          id: values.id
        },
        {
          onSuccess() {
            props.onClose();
            toast({
              title: t("credential-successfully-updated")
            });
          },
          onError() {
            toast({
              title: t("error-while-updating-credential"),
              status: "error"
            });
          }
        }
      );
    }

    return createCredential.mutate(values, {
      onSuccess() {
        props.onClose();
        toast({
          title: t("credential-successfully-created")
        });
      },
      onError() {
        toast({
          title: t("error-while-creating-credential"),
          status: "error"
        });
      }
    });
  };

  const title = props.credential?.id
    ? t("edit-credential")
    : t("new-credential");
  const isMutating = createCredential.isLoading || updateCredential.isLoading;

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
      {credential.isFetching ? (
        <ModalContent>
          <ModalBody>
            <Center p={10}>
              <Loading />
            </Center>
          </ModalBody>
        </ModalContent>
      ) : credential.isError ? (
        <ModalContent>
          <ModalHeader>{title}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Center p={10}>
              <Text color="red.400" fontWeight="semibold">
                {t("error-while-reading-credential")}
              </Text>
            </Center>
          </ModalBody>
          <ModalFooter>
            <Button
              mr={3}
              colorScheme="orange"
              onClick={() => credential.refetch()}
            >
              {t("retry")}
            </Button>
            <Button onClick={props.onClose} variant="ghost">
              {t("cancel")}
            </Button>
          </ModalFooter>
        </ModalContent>
      ) : (
        <ModalContent>
          <ModalHeader>{title}</ModalHeader>
          <ModalCloseButton />
          <form onSubmit={handleSubmit(onSubmit)}>
            <ModalBody>
              <VStack gap={5}>
                <FormControl isInvalid={!!errors.issuer}>
                  <FormLabel htmlFor="issuer">
                    {t("credential-issuer")}
                  </FormLabel>
                  <Input
                    id="issuer"
                    placeholder={String(t("credential-issuer"))}
                    {...register("issuer", {
                      required: String(t("field-is-required"))
                    })}
                  />

                  <FormErrorMessage>
                    {errors.credential_type && errors.credential_type.message}
                  </FormErrorMessage>
                </FormControl>
                <FormControl isInvalid={!!errors.credential_type}>
                  <FormLabel htmlFor="type">{t("credential-type")}</FormLabel>
                  <Input
                    id="type"
                    placeholder={String(t("credential-type"))}
                    {...register("credential_type", {
                      required: String(t("field-is-required"))
                    })}
                  />

                  <FormErrorMessage>
                    {errors.credential_type && errors.credential_type?.message}
                  </FormErrorMessage>
                </FormControl>
                <FormControl isInvalid={!!errors.content}>
                  <FormLabel htmlFor="content">
                    {t("credential-content")}
                  </FormLabel>
                  <Textarea
                    id="content"
                    placeholder={String(t("credential-content"))}
                    {...register("content", {
                      required: String(t("field-is-required"))
                    })}
                  />

                  <FormErrorMessage>
                    {errors.content && errors.content?.message}
                  </FormErrorMessage>
                </FormControl>
              </VStack>
            </ModalBody>

            <ModalFooter>
              <Button
                mr={3}
                colorScheme="orange"
                isLoading={isMutating}
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
      )}
    </Modal>
  );
}
