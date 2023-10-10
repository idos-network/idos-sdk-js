import { idos } from "@/lib/idos";
import { createMutation } from "react-query-kit";

type CreateCredentialVars = { issuer: string; credential_type: string; content: string };
type UpdateCredentialVars = { id: string; issuer: string; credential_type: string; content: string };

export const useCreateCredential = createMutation({
  mutationFn: async ({ issuer, credential_type, content }: CreateCredentialVars) => {
    return idos.data.create("credentials", {
      issuer,
      credential_type,
      content,
    });
  },
});

export const useUpdateCredential = createMutation({
  mutationFn: async ({ id, issuer, credential_type, content }: UpdateCredentialVars) => {
    return idos.data.update("credentials", {
      id,
      issuer,
      credential_type,
      content,
    });
  },
});

export const useRemoveCredential = createMutation({
  mutationFn: async ({ id }: { id: string }) => {
    return idos.data.delete("credentials", id);
  },
});
