import { kwil } from "@/lib/db";
import { idos } from "@/lib/idos";
import { buildTx } from "@/lib/mutations";
import { Utils } from "@kwilteam/kwil-js";
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

export const useShareCredential = createMutation({
  mutationFn: async ({
    id,
    issuer,
    credential_type,
    content,
    original_credential_id,
  }: UpdateCredentialVars & { original_credential_id: string }) => {
    const inputs = new Utils.ActionInput()
      .put("$id", id)
      .put("$issuer", issuer)
      .put("$credential_type", credential_type)
      .put("$content", content)
      .put("$original_credential_id", original_credential_id);
    const tx = await buildTx("share_credential", inputs);

    return kwil.broadcast(tx);
  },
});
