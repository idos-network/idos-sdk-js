import { Utils } from "@kwilteam/kwil-js";
import { createMutation } from "react-query-kit";

import { kwil } from "@/lib/db";
import { buildTx } from "@/lib/mutations";

type AttributeVars = { id: string; attribute_key: string; value: string };
export const useCreateAttribute = createMutation({
  mutationFn: async ({ id, attribute_key, value }: AttributeVars) => {
    const inputs = new Utils.ActionInput().put("$id", id).put("$attribute_key", attribute_key).put("$value", value);
    const tx = await buildTx("add_attribute", inputs);

    return kwil.broadcast(tx);
  },
});

export const useUpdateAttribute = createMutation({
  mutationFn: async ({ id, attribute_key, value }: AttributeVars) => {
    const inputs = new Utils.ActionInput().put("$id", id).put("$attribute_key", attribute_key).put("$value", value);
    const tx = await buildTx("edit_attribute", inputs);

    return kwil.broadcast(tx);
  },
});

export const useRemoveAttribute = createMutation({
  mutationFn: async ({ id }: { id: string }) => {
    const inputs = new Utils.ActionInput().put("$id", id);
    const tx = await buildTx("remove_attribute", inputs);

    return kwil.broadcast(tx);
  },
});

export const useShareAttribute = createMutation({
  mutationFn: async ({
    id,
    attribute_key,
    value,
    original_attribute_id,
  }: AttributeVars & { original_attribute_id: string }) => {
    const inputs = new Utils.ActionInput()
      .put("$id", id)
      .put("$attribute_key", attribute_key)
      .put("$value", value)
      .put("$original_attribute_id", original_attribute_id);
    const tx = await buildTx("share_attribute", inputs);

    return kwil.broadcast(tx);
  },
});
