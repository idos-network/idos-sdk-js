import { useIdOS } from "@/core/idos";
import type { idOSGrant } from "@idos-network/idos-sdk";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { idOSCredentialWithShares } from "../types";

export const useFetchGrants = ({ credentialId }: { credentialId: string }) => {
  const { sdk } = useIdOS();
  const queryClient = useQueryClient();
  const credentials = queryClient.getQueryData<idOSCredentialWithShares[]>(["credentials"]);

  return useQuery({
    queryKey: ["grants", credentialId],
    queryFn: async () => {
      const { grants } = await sdk.grants.getGrantsOwned();
      return grants;
    },
    retry: 1,
    select(grants) {
      if (!credentials || !grants) return [];

      const _credentials = credentials
        .filter((credential) => credential.original_id === credentialId)
        .map((credential) => credential.id);

      return grants.filter((grant) => _credentials.includes(grant.dataId));
    },
  });
};

type Ctx = { previousGrants: idOSGrant[] };

export const useRevokeGrant = (credentialId?: string) => {
  const { sdk } = useIdOS();
  const queryClient = useQueryClient();

  return useMutation<string | undefined, Error, idOSGrant, Ctx>({
    mutationFn: ({ id }: idOSGrant) => sdk.grants.revokeGrant(id || ""),
    mutationKey: ["revokeGrant"],
    onMutate: async (grant): Promise<Ctx> => {
      const previousGrants = queryClient.getQueryData<idOSGrant[]>(["grants", credentialId]) || [];
      queryClient.setQueryData<idOSGrant[]>(
        ["grants", credentialId],
        () => previousGrants?.filter((g) => g.id !== grant.id) || [],
      );
      return { previousGrants };
    },
    onError: (_error, _grant, context) => {
      if (context?.previousGrants) {
        queryClient.setQueryData(["grants", credentialId], context.previousGrants);
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["grants"] }),
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
    mutationKey: ["revokeGrants"],
  });
};
