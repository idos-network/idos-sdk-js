import { createMutation } from "react-query-kit";
import { idOS } from "#/lib/idos";

export const useDeleteCredential = createMutation({
  mutationFn: async ({ id }: { id: string }) => {
    return idOS.data.delete("credentials", id);
  }
});
