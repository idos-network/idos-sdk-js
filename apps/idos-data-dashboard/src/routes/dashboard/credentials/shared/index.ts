import { useIdOS } from "@/idOS.provider";
import type { idOSGrant } from "@idos-network/core";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { idOSCredentialWithShares } from "../types";

export const useFetchGrants = ({ credentialId }: { credentialId: string }) => {
  const idOSClient = useIdOS();
  const queryClient = useQueryClient();
  const credentials = queryClient.getQueryData<idOSCredentialWithShares[]>(["credentials"]);

  return useQuery({
    queryKey: ["grants", credentialId],
    queryFn: async () => {
      return idOSClient.getAccessGrantsOwned();
    },
    retry: 1,
    select(grants) {
      if (!credentials || !grants) return [];

      const _credentials = credentials
        .filter((credential) => credential.original_id === credentialId)
        .map((credential) => credential.id);

      return grants.filter((grant) => _credentials.includes(grant.data_id));
    },
  });
};

type Ctx = { previousGrants: idOSGrant[] };

export const useRevokeGrant = (credentialId?: string) => {
  const idOSClient = useIdOS();
  const queryClient = useQueryClient();

  return useMutation<string, Error, idOSGrant, Ctx>({
    mutationFn: async (grant: idOSGrant) => {
      await idOSClient.revokeAccessGrant(grant.id);

      return grant.id;
    },
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
