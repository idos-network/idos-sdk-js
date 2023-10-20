import { idos } from "@/lib/idos";
import { createMutation } from "react-query-kit";
import { Credential } from "../types";

type CreateCredentialVars = { issuer: string; credential_type: string; content: string };
type UpdateCredentialVars = {
  id: string;
  issuer: string;
  credential_type: string;
  content: string;
  encryption_public_key: string;
};

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
  mutationFn: async ({ id, issuer, credential_type, content, encryption_public_key }: UpdateCredentialVars) => {
    return idos.data.update("credentials", {
      id,
      issuer,
      credential_type,
      content,
      encryption_public_key,
    });
  },
});

export const useRemoveCredential = createMutation({
  mutationFn: async ({ id }: { id: string }) => {
    return idos.data.delete("credentials", id);
  },
});

export const useShareCredential = createMutation({
  mutationFn: async (values: Credential & { address: string; key: string }) => {
    const { key, id, address } = values;
    return idos.grants.create("credentials", id, address, 0, key);
  },
});

export const useRevokeCredentialShare = createMutation({
  mutationFn: async ({ recordId, grantee, dataId }: { recordId: string; grantee: string; dataId: string }) => {
    return idos.grants.revoke("credentials", recordId, grantee, dataId);
  },
});
