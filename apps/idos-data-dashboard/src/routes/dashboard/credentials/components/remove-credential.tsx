import { useToast } from "@chakra-ui/react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { ConfirmDialog } from "@/lib/components/confirm-dialog.tsx";
import { useRemoveCredential } from "../mutations";
import { useFetchCredentials } from "../queries";
import { Credential } from "../types";

type RemoveCredentialProps = {
  credential: Credential | undefined;
  isOpen: boolean;
  onClose: () => void;
};
export function RemoveCredential(props: RemoveCredentialProps) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { t } = useTranslation();

  const removeCredential = useRemoveCredential({
    async onMutate(credential) {
      await queryClient.cancelQueries(useFetchCredentials.getKey());

      const previousCredentials = queryClient.getQueryData<Credential[]>(
        useFetchCredentials.getKey()
      );

      if (previousCredentials) {
        queryClient.setQueryData<Credential[]>(useFetchCredentials.getKey(), [
          ...previousCredentials.filter(({ id }) => id !== credential.id)
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
    }
  });

  const onCredentialRemove = () => {
    if (!props.credential?.id) {
      return;
    }

    removeCredential.mutate(
      {
        id: props.credential.id
      },
      {
        onSuccess() {
          props.onClose();
          toast({
            title: t("credential-successfully-removed")
          });
        },
        onError() {
          toast({
            title: t("error-while-removing-credential"),
            status: "error"
          });
        }
      }
    );
  };

  return (
    <ConfirmDialog
      isOpen={props.isOpen}
      title={t("remove-credential")}
      description={t("are-sure-you-want-to-remove-credential", {
        issuer: props.credential?.issuer
      })}
      isLoading={removeCredential.isLoading}
      onClose={props.onClose}
      onConfirm={onCredentialRemove}
    />
  );
}
