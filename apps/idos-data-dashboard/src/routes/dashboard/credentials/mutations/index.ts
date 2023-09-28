import { kwil } from "@/lib/db";
import { buildTx } from "@/lib/mutations";
import { Utils } from "@kwilteam/kwil-js";
import { createMutation } from "react-query-kit";

type CredentialVars = { id: string; issuer: string; credential_type: string; content: string };

export const useCreateCredential = createMutation({
  mutationFn: async ({ id, issuer, credential_type, content }: CredentialVars) => {
    const inputs = new Utils.ActionInput()
      .put("$id", id)
      .put("$issuer", issuer)
      .put("$credential_type", credential_type)
      .put("$content", content);
    const tx = await buildTx("add_credential", inputs);

    return kwil.broadcast(tx);
  },
});

export const useUpdateCredential = createMutation({
  mutationFn: async ({ id, issuer, credential_type, content }: CredentialVars) => {
    const inputs = new Utils.ActionInput()
      .put("$id", id)
      .put("$issuer", issuer)
      .put("$credential_type", credential_type)
      .put("$content", content);
    const tx = await buildTx("edit_credential", inputs);

    return kwil.broadcast(tx);
  },
});

export const useRemoveCredential = createMutation({
  mutationFn: async ({ id }: { id: string }) => {
    const inputs = new Utils.ActionInput().put("$id", id);
    const tx = await buildTx("remove_credential", inputs);

    return kwil.broadcast(tx);
  },
});

export const useShareCredential = createMutation({
  mutationFn: async ({
    id,
    issuer,
    credential_type,
    content,
    original_credential_id,
  }: CredentialVars & { original_credential_id: string }) => {
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
