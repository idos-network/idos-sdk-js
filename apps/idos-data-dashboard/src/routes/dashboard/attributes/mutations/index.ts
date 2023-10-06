import { Utils } from "@kwilteam/kwil-js";
import { createMutation } from "react-query-kit";

import { kwil } from "@/lib/db";
import { idos } from "@/lib/idos";
import { buildTx } from "@/lib/mutations";
import invariant from "tiny-invariant";

type AttributeVars = { id?: string; attribute_key: string; value: string };

export const useCreateAttribute = createMutation({
  mutationFn: async ({ attribute_key, value }: AttributeVars) => {
    return await idos.data.create("attributes", {
      attribute_key,
      value,
    });
  },
});

export const useUpdateAttribute = createMutation({
  mutationFn: async ({ id, attribute_key, value }: AttributeVars) => {
    invariant(id, "`id` is required in order to update an attribute value");
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

export const useShareAttribute = createMutation({
  mutationFn: async ({
    id,
    attribute_key,
    value,
    original_attribute_id,
  }: AttributeVars & { original_attribute_id: string }) => {
    invariant(id, "`id` is required in order to share an attribute");
    const inputs = new Utils.ActionInput()
      .put("$id", id)
      .put("$attribute_key", attribute_key)
      .put("$value", value)
      .put("$original_attribute_id", original_attribute_id);
    const tx = await buildTx("share_attribute", inputs);

    return kwil.broadcast(tx);
  },
});
