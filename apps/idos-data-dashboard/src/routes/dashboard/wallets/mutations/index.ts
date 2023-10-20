import { createMutation } from "react-query-kit";

import { idos } from "@/lib/idos";

export const useCreateWallet = createMutation({
  mutationFn: async ({ address }: { address: string }) => {
    return idos.data.create("wallets", { address, signature: "", message: "" });
  }
});

export const useRemoveWallet = createMutation({
  mutationFn: async ({ id }: { id: string }) => {
    return idos.data.delete("wallets", id);
  }
});
