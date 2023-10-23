import { idOS } from "#/lib/idos";
import { createMutation } from "react-query-kit";

export const useDeleteCredential = createMutation({
  mutationFn: async ({ id }: { id: string }) => {
    return idOS.data.delete("credentials", id);
  }
});
