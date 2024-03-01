import { useIdOS } from "@/core/idos";
import { type DefaultError, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { idOSCredential, idOSGrant } from "../types";

export const useFetchGrants = ({ credentialId }: { credentialId: string }) => {
  const { sdk, address } = useIdOS();
  const queryClient = useQueryClient();
  const credentials = queryClient.getQueryData<idOSCredential[]>(["credentials"]);

  return useQuery({
    queryKey: ["grants", credentialId],
    queryFn: () => sdk.grants.list({ owner: address }),
    select(grants) {
      if (!credentials || !grants) return [];

      const _credentials = credentials
        .filter((credential) => credential.original_id === credentialId)
        .map((credential) => credential.id);

      return grants.filter((grant) => _credentials.includes(grant.dataId));
    }
  });
};

type Ctx = { previousCredentials: idOSCredential[] };

export const useRevokeGrant = () => {
  const { sdk } = useIdOS();
  const queryClient = useQueryClient();

  return useMutation<{ transactionId: string }, DefaultError, idOSGrant, Ctx>({
    mutationFn: ({ grantee, dataId, lockedUntil }: idOSGrant) =>
      sdk.grants.revoke("credentials", dataId, grantee, dataId, lockedUntil),
    mutationKey: ["revokeGrant"],
    async onMutate(grant) {
      const previousCredentials = queryClient.getQueryData<idOSCredential[]>(["credentials"]) ?? [];
      const index = previousCredentials.findIndex((credential) =>
        credential.shares.includes(grant.dataId)
      );
      const parent = { ...previousCredentials[index] };
      parent.shares = parent.shares.filter((id) => id !== grant.dataId);
      const credentials = Object.assign([], previousCredentials, { [index]: parent });
      queryClient.setQueryData<idOSCredential[]>(["credentials"], () => credentials);

      return {
        previousCredentials
      };
    },

    onError(_, __, ctx) {
      queryClient.setQueryData<idOSCredential[]>(["credentials"], ctx?.previousCredentials);
    }
  });
};

export const useRevokeGrants = () => {
  const revokeGrant = useRevokeGrant();

  return useMutation({
    mutationFn: async (grants: idOSGrant[]) => {
      for (const grant of grants) {
        await revokeGrant.mutateAsync(grant, { onError() {} });
      }
    },
    mutationKey: ["revokeGrants"]
  });
};
