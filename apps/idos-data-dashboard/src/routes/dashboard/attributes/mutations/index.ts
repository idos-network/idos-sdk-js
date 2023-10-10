import { createMutation } from "react-query-kit";

import { idos } from "@/lib/idos";

type CreateAttributeVars = { attribute_key: string; value: string };
type UpdateAttributeVars = { id: string; attribute_key: string; value: string };

export const useCreateAttribute = createMutation({
  mutationFn: async ({ attribute_key, value }: CreateAttributeVars) => {
    return await idos.data.create("attributes", {
      attribute_key,
      value,
    });
  },
});

export const useUpdateAttribute = createMutation({
  mutationFn: async ({ id, attribute_key, value }: UpdateAttributeVars) => {
    return await idos.data.update("attributes", {
      id,
      attribute_key,
      value,
    });
  },
});

export const useRemoveAttribute = createMutation({
  mutationFn: async ({ id }: { id: string }) => {
    return idos.data.delete("attribute", id);
  },
});
