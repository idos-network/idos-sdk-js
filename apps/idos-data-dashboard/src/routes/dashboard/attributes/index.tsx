import { Box, Button, Code, Flex, useDisclosure, useToast } from "@chakra-ui/react";
import { isError, useQueryClient } from "@tanstack/react-query";
import { useAtomValue } from "jotai";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useRouteError } from "react-router-dom";
import invariant from "tiny-invariant";

import { ConfirmDialog } from "@/lib/components/confirm-dialog";
import { decrypt, encrypt } from "@/lib/encryption";
import { useStoredCredentials } from "@/lib/hooks";
import { signerAtom } from "@/lib/store";

import { AttributeEditor, AttributeEditorFormValues } from "./components/attribute-editor";
import { AttributesTable } from "./components/attributes-table";
import { ShareAttribute } from "./components/share-attribute";
import { SharesEditor } from "./components/shares-editor.tsx";
import { useCreateAttribute, useRemoveAttribute, useUpdateAttribute } from "./mutations";
import { useFetchAttributes } from "./queries";
import { Attribute } from "./types";

const createEmptyAttribute = (): Attribute => ({
  id: "",
  attribute_key: "",
  value: "",
  original_id: "",
});

export function Component() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const toast = useToast();
  const { isOpen: isEditorOpen, onOpen: onEditorOpen, onClose: onEditorClose } = useDisclosure();
  const { isOpen: isConfirmOpen, onOpen: onConfirmOpen, onClose: onConfirmClose } = useDisclosure();
  const { isOpen: isSharesEditorOpen, onOpen: onSharesEditorOpen, onClose: onSharesEditorClose } = useDisclosure();
  const { isOpen: isShareOpen, onOpen: onShareOpen, onClose: onShareClose } = useDisclosure();

  const [attribute, setAttribute] = useState<Attribute>();
  const signer = useAtomValue(signerAtom);
  const credentials = useStoredCredentials();

  invariant(credentials, "Credentials are not available");

  const attributes = useFetchAttributes({
    useErrorBoundary: true,
  });

  const createAttribute = useCreateAttribute({
    async onMutate(attribute) {
      await queryClient.cancelQueries(useFetchAttributes.getKey());
      const previousAttributes = queryClient.getQueryData<Attribute[]>(useFetchAttributes.getKey());

      if (previousAttributes) {
        const newAttribute: Attribute = {
          ...attribute,
          original_id: "",
        };

        queryClient.setQueryData<Attribute[]>(useFetchAttributes.getKey(), [...previousAttributes, newAttribute]);
      }

      return { previousAttributes };
    },

    onError(_, __, context) {
      if (context?.previousAttributes) {
        attributes.setData(context.previousAttributes);
      }
    },
  });
  const updateAttribute = useUpdateAttribute({
    async onMutate(vars) {
      await queryClient.cancelQueries(useFetchAttributes.getKey());
      const previousAttributes = queryClient.getQueryData<Attribute[]>(useFetchAttributes.getKey()) ?? [];

      const attributeIndex = previousAttributes?.findIndex(({ id }) => id === vars.id) ?? -1;
      previousAttributes[attributeIndex] = { ...vars };

      queryClient.setQueryData<Attribute[]>(useFetchAttributes.getKey(), [...previousAttributes]);

      attributes.setData([...previousAttributes]);

      return { previousAttributes };
    },

    onError(_, __, context) {
      if (context?.previousAttributes) {
        attributes.setData(context.previousAttributes);
      }
    },
  });
  const removeAttribute = useRemoveAttribute({
    async onMutate(attribute) {
      await queryClient.cancelQueries(useFetchAttributes.getKey());
      const previousAttributes = attributes.data;
      if (previousAttributes) {
        attributes.setData([...previousAttributes.filter((a) => a.id !== attribute.id)]);
      }
      return { previousAttributes };
    },

    onError(_, __, context) {
      if (context?.previousAttributes) {
        attributes.setData(context.previousAttributes);
      }
    },
  });

  const handleOnEditorClose = () => {
    setAttribute(createEmptyAttribute());
    onEditorClose();
  };

  const onAttributeEdit = (values: Attribute) => {
    setAttribute({
      ...values,
    });
    onEditorOpen();
  };

  const onEditorSubmit = (values: AttributeEditorFormValues) => {
    onEditorClose();
    const mutation = values.id ? updateAttribute : createAttribute;
    const id = values.id || crypto.randomUUID();

    invariant(signer, "Signer is not available");

    const { value } = values;
    const encryptedValue = encrypt(value, credentials.publicKey, credentials.secretKey);

    mutation.mutate(
      {
        ...values,
        value: encryptedValue,
        id,
      },
      {
        onSuccess() {
          toast({
            title: t("attribute-successfully-created", { name: values.attribute_key }),
          });
        },
        onError() {
          toast({
            title: t("error-while-creating-attribute", { name: values.attribute_key }),
            status: "error",
          });
        },
      }
    );
  };

  const onAttributeRemove = (attribute: Attribute) => {
    setAttribute(attribute);
    onConfirmOpen();
  };

  const onAttributeRemoveCancel = () => {
    setAttribute(createEmptyAttribute());
    onConfirmClose();
  };

  const onRemoveConfirm = () => {
    onConfirmClose();
    invariant(signer, "Signer is not available");
    if (attribute) {
      removeAttribute.mutate(
        {
          id: attribute.id,
        },
        {
          onSuccess() {
            setAttribute(createEmptyAttribute());

            toast({
              title: t("attribute-successfully-removed", { name: attribute.attribute_key }),
            });
          },
          onError() {
            toast({
              title: t("error-while-removing-attribute", { name: attribute.attribute_key }),
              status: "error",
            });
          },
        }
      );
    }
  };

  const handleShareOpen = (attribute: Attribute) => {
    setAttribute(attribute);
    onShareOpen();
  };

  const handleShareClose = () => {
    setAttribute(undefined);
    onShareClose();
  };

  const handleSharesEditorOpen = (attribute: Attribute) => {
    setAttribute(attribute);
    onSharesEditorOpen();
  };

  const handleSharesEditorClose = () => {
    setAttribute(undefined);
    onSharesEditorClose();
  };

  const ownAttributes = useMemo(
    () =>
      attributes.data
        ?.filter(({ original_id }) => original_id === "")
        .map((attribute) => ({
          ...attribute,
          value: decrypt(attribute.value, credentials.publicKey, credentials.secretKey),
          shares: attributes.data?.filter((a) => a.original_id === attribute.id).map((a) => a.id),
        })),
    [attributes.data, credentials.publicKey, credentials.secretKey]
  );

  const isLoadingAttributes =
    attributes.isFetching || createAttribute.isLoading || updateAttribute.isLoading || removeAttribute.isLoading;

  return (
    <Box>
      <Flex align="center" justify="end" mb={5}>
        <Button colorScheme="green" onClick={onEditorOpen} variant="outline">
          {t("new-attribute")}
        </Button>
      </Flex>
      <AttributesTable
        isLoading={isLoadingAttributes}
        attributes={ownAttributes}
        onAttributeEdit={onAttributeEdit}
        onAttributeRemove={onAttributeRemove}
        onViewAttributeShares={handleSharesEditorOpen}
        onAttributeShare={handleShareOpen}
      />
      <AttributeEditor
        isOpen={isEditorOpen}
        onClose={handleOnEditorClose}
        onSubmit={onEditorSubmit}
        isLoading={createAttribute.isLoading || updateAttribute.isLoading}
        values={attribute}
      />
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={onAttributeRemoveCancel}
        onConfirm={onRemoveConfirm}
        title={t("remove-attribute")}
        isLoading={removeAttribute.isLoading}
        description={t("are-sure-you-want-to-remove-attribute", { name: attribute?.attribute_key })}
      />

      <ShareAttribute isOpen={isShareOpen} onClose={handleShareClose} attribute={attribute} />
      <SharesEditor isOpen={isSharesEditorOpen} onClose={handleSharesEditorClose} attribute={attribute} />
    </Box>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();

  return <Code>{isError(error) ? error.message : "Unknown error"}</Code>;
}
