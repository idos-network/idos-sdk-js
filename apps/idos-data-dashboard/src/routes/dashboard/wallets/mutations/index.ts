import { Utils } from "@kwilteam/kwil-js";
import { createMutation } from "react-query-kit";

import { kwil } from "@/lib/db";
import { buildTx } from "@/lib/mutations";

export const useCreateWallet = createMutation({
  mutationFn: async ({ address }: { address: string }) => {
    const inputs = new Utils.ActionInput()
      .put("$id", crypto.randomUUID())
      .put("$address", address)
      .put("$signature", "N/A")
      .put("$message", "N/A")
      .put("$issuer", "N/A");
    const tx = await buildTx("add_wallet", inputs);

    return kwil.broadcast(tx);
  },
});

export const useRemoveWallet = createMutation({
  mutationFn: async ({ id }: { id: string }) => {
    const inputs = new Utils.ActionInput().put("$id", id);
    const tx = await buildTx("remove_wallet", inputs);

    return kwil.broadcast(tx);
  },
});
