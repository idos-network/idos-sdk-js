import { Box, Button, Code, Flex, useDisclosure, useToast } from "@chakra-ui/react";
import { isError, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useRouteError } from "react-router-dom";

import { ConfirmDialog } from "@/lib/components/confirm-dialog";
import { AttributeEditor, AttributeEditorFormValues } from "./components/attribute-editor";
import { AttributesTable } from "./components/attributes-table";
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

  const [attribute, setAttribute] = useState<Attribute>();

  const attributes = useFetchAttributes({
    useErrorBoundary: true,
    select: (data) =>
      data
        ?.filter(({ original_id }) => original_id === "")
        .map((attribute) => ({
          ...attribute,
          shares: data?.filter((a) => a.original_id === attribute.id).map((a) => a.id),
        })),
  });

  const createAttribute = useCreateAttribute({
    async onMutate(attribute) {
      await queryClient.cancelQueries(useFetchAttributes.getKey());
      const previousAttributes = queryClient.getQueryData<Attribute[]>(useFetchAttributes.getKey());

      if (previousAttributes) {
        const newAttribute: Attribute = {
          id: crypto.randomUUID(),
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
      previousAttributes[attributeIndex] = { ...vars, id: vars.id ?? "" };
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
    if (values.id) {
      return updateAttribute.mutate(
        {
          ...values,
          id: values.id,
        },
        {
          onSuccess() {
            toast({
              title: t("attribute-successfully-updated", { name: values.attribute_key }),
            });
          },
          onError() {
            toast({
              title: t("error-while-updating-attribute", { name: values.attribute_key }),
              status: "error",
            });
          },
        }
      );
    }

    createAttribute.mutate(
      {
        ...values,
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
        attributes={attributes.data}
        onAttributeEdit={onAttributeEdit}
        onAttributeRemove={onAttributeRemove}
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
    </Box>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();

  return <Code>{isError(error) ? error.message : "Unknown error"}</Code>;
}
